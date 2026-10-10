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
MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


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


def _split_into_chunks(text: str, max_chars: int = 1200) -> list:
    """
    Chia tài liệu thành chunks, KHÔNG cắt giữa section/bước.
    """
    lines = text.split("\n")
    chunks = []
    current = ""

    for line in lines:
        is_new_section = line.startswith("## ") or line.startswith("### ")
        is_new_step = line.strip().startswith("## Bước") or \
                      line.strip().startswith("### Bước")
        is_boundary = is_new_section or is_new_step

        if is_boundary and current.strip():
            if len(current.strip()) > 50:
                chunks.append(current.strip())
            current = line + "\n"
        else:
            current += line + "\n"

        if len(current) > max_chars and not is_boundary:
            if len(current.strip()) > 50:
                chunks.append(current.strip())
            overlap = current[-200:] if len(current) > 200 else ""
            current = overlap

    if current.strip() and len(current.strip()) > 50:
        chunks.append(current.strip())

    return chunks


def index_documents(force_reindex: bool = False):
    """Index tất cả file .md vào ChromaDB."""
    if not DOCUMENTS_DIR.exists():
        print(f"[RAG] Documents dir not found: {DOCUMENTS_DIR}")
        return 0

    collection = _get_collection()

    if collection.count() > 0 and not force_reindex:
        print(f"[RAG] Collection already has {collection.count()} documents. Skip indexing.")
        return collection.count()

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

        chunks = _split_into_chunks(content)
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

    print(f"[RAG] Encoding {len(documents)} chunks...")
    embeddings = model.encode(documents, show_progress_bar=False).tolist()

    collection.add(
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids,
    )

    print(f"[RAG] Indexed {len(documents)} chunks from {len(md_files)} files.")
    return len(documents)


def retrieve_context(query: str, top_k: int = 5) -> str:
    """Tìm top_k chunks liên quan tới query, filter theo similarity."""
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
        if score >= 0.05:
            context += f"\n**[{src}]** (độ liên quan: {score:.2f})\n{chunk}\n"

    return context


def retrieve_by_source(query: str, source_filter: str = None, top_k: int = 15) -> str:
    """
    Retrieve chunks theo source file cụ thể.
    Fix BUG-001: Khi user hỏi về 1 chủ đề có file riêng (VD: "quy trình đặt xe"
    → file 04-quy-trinh-dat-xe.md), fetch TẤT CẢ chunks của file đó thay vì
    chỉ dựa vào similarity.
    """
    collection = _get_collection()
    if collection.count() == 0:
        return ""

    # Nếu có source_filter, lấy TẤT CẢ chunks từ file đó
    if source_filter:
        try:
            filename = f"{source_filter}.md" if not source_filter.endswith(".md") else source_filter
            data = collection.get(where={"source": filename})
            if not data or not data.get("documents"):
                try:
                    data = collection.get(where={"source": {"$contains": source_filter}})
                except Exception:
                    pass
            docs = data.get("documents", [])
            metadatas = data.get("metadatas", [])

            if docs:
                # Sort theo chunk_index để đảm bảo thứ tự
                sorted_pairs = sorted(
                    zip(docs, metadatas),
                    key=lambda x: x[1].get("chunk_index", 0)
                )

                context = f"\n### TÀI LIỆU THAM KHẢO ({source_filter}):\n"
                for doc, meta in sorted_pairs:
                    src = meta.get("source", "?")
                    context += f"\n**[{src}]**\n{doc}\n"
                print(f"[RAG] Source filter '{source_filter}': got {len(docs)} chunks")
                return context
        except Exception as e:
            print(f"[RAG] Source filter failed: {e}")

    # Fallback: similarity search
    return retrieve_context(query, top_k=top_k)


def get_stats() -> dict:
    """Trả về thống kê của RAG collection."""
    try:
        collection = _get_collection()
        count = collection.count()

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