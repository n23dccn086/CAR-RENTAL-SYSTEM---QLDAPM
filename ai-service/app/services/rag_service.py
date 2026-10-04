import os
from pathlib import Path
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer


# ===== Globals (lazy load) =====
_client = None
_collection = None
_model = None

# Đường dẫn tài liệu
DOCUMENTS_DIR = Path(__file__).parent.parent.parent / "data" / "documents"
CHROMA_DB_DIR = Path(__file__).parent.parent.parent / "data" / "chroma_db"

COLLECTION_NAME = "maison_documents"
MODEL_NAME = "all-MiniLM-L6-v2"


def _get_model() -> SentenceTransformer:
    """Lazy load embedding model."""
    global _model
    if _model is None:
        print(f"[RAG] Loading embedding model: {MODEL_NAME}...")
        _model = SentenceTransformer(MODEL_NAME)
        print(f"[RAG] Model loaded. Dimension: {_model.get_sentence_embedding_dimension()}")
    return _model


def _get_collection():
    """Lazy init ChromaDB collection."""
    global _client, _collection
    if _collection is None:
        CHROMA_DB_DIR.mkdir(parents=True, exist_ok=True)
        _client = chromadb.PersistentClient(path=str(CHROMA_DB_DIR))
        _collection = _client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
        print(f"[RAG] ChromaDB collection '{COLLECTION_NAME}' ready.")
    return _collection


def _split_into_chunks(text: str, max_chars: int = 500) -> list:
    """Chia tài liệu thành chunks nhỏ theo section."""
    lines = text.split("\n")
    chunks = []
    current = ""

    for line in lines:
        # Section mới → lưu chunk cũ
        if line.startswith("## ") and current.strip():
            if len(current.strip()) > 50:
                chunks.append(current.strip())
            current = line + "\n"
        else:
            current += line + "\n"

        # Quá dài → cắt
        if len(current) > max_chars:
            if len(current.strip()) > 50:
                chunks.append(current.strip())
            current = ""

    # Chunk cuối
    if current.strip() and len(current.strip()) > 50:
        chunks.append(current.strip())

    return chunks


def index_documents(force_reindex: bool = False):
    """Index tất cả file .md vào ChromaDB."""
    if not DOCUMENTS_DIR.exists():
        print(f"[RAG] Documents dir not found: {DOCUMENTS_DIR}")
        return 0

    collection = _get_collection()

    # Nếu đã có data và không force → skip
    if collection.count() > 0 and not force_reindex:
        print(f"[RAG] Collection already has {collection.count()} documents. Skip indexing.")
        return collection.count()

    # Force reindex → xóa cũ
    if force_reindex and collection.count() > 0:
        print(f"[RAG] Force reindex: deleting {collection.count()} old documents...")
        all_ids = collection.get()["ids"]
        if all_ids:
            collection.delete(ids=all_ids)

    model = _get_model()

    documents = []
    metadatas = []
    ids = []

    md_files = sorted(DOCUMENTS_DIR.glob("*.md"))
    if not md_files:
        print(f"[RAG] No .md files found in {DOCUMENTS_DIR}")
        return 0

    for file_path in md_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        chunks = _split_into_chunks(content, max_chars=500)
        for j, chunk in enumerate(chunks):
            documents.append(chunk)
            metadatas.append({
                "source": file_path.name,
                "chunk_index": j,
            })
            ids.append(f"{file_path.stem}__{j}")

    if not documents:
        print("[RAG] No chunks to index.")
        return 0

    # Vector hóa
    print(f"[RAG] Encoding {len(documents)} chunks...")
    embeddings = model.encode(documents, show_progress_bar=False).tolist()

    # Lưu vào ChromaDB
    collection.add(
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids,
    )

    print(f"[RAG] Indexed {len(documents)} chunks from {len(md_files)} files.")
    return len(documents)


def retrieve_context(query: str, top_k: int = 3) -> str:
    """Tìm top_k chunks liên quan tới query."""
    collection = _get_collection()

    if collection.count() == 0:
        print("[RAG] Collection is empty. Cannot retrieve.")
        return ""

    model = _get_model()
    query_embedding = model.encode([query]).tolist()[0]

    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, collection.count()),
        )
    except Exception as e:
        print(f"[RAG] Query failed: {e}")
        return ""

    if not results["documents"] or not results["documents"][0]:
        return ""

    chunks = results["documents"][0]
    sources = [m.get("source", "?") for m in results["metadatas"][0]]
    distances = results.get("distances", [[]])[0]

    context = "\n### TÀI LIỆU THAM KHẢO:\n"
    for i, (chunk, src) in enumerate(zip(chunks, sources)):
        score = 1 - distances[i] if i < len(distances) else 0
        context += f"\n**[{src}]** (độ liên quan: {score:.2f})\n{chunk}\n"

    return context


def get_stats() -> dict:
    """Trả về thống kê của RAG collection."""
    try:
        collection = _get_collection()
        count = collection.count()

        # Đếm số file
        files = {}
        if count > 0:
            data = collection.get()
            for meta in data.get("metadatas", []):
                src = meta.get("source", "?")
                files[src] = files.get(src, 0) + 1

        return {
            "total_chunks": count,
            "total_files": len(files),
            "files": files,
        }
    except Exception as e:
        return {"error": str(e)}