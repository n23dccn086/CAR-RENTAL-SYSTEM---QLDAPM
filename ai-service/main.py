from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.chat import router as chat_router
from app.core.config import get_settings
from app.services.rag_service import index_documents, get_stats

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup + Shutdown events."""
    # ===== STARTUP =====
    print("=" * 60)
    print("Starting AI Service...")
    print("=" * 60)

    # Index RAG documents
    try:
        count = index_documents()
        stats = get_stats()
        print(f"[Startup] RAG ready: {count} chunks from {stats.get('total_files', 0)} files")
    except Exception as e:
        print(f"[Startup] RAG indexing failed: {e}")

    print("=" * 60)
    yield
    # ===== SHUTDOWN =====
    print("Shutting down AI Service...")


app = FastAPI(
    title="Car Rental AI Service",
    description="AI Chatbot cho hệ thống Car Rental System (có RAG)",
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)


@app.get("/health")
async def health():
    """Health check + RAG stats."""
    stats = get_stats()
    return {
        "status": "healthy",
        "service": "ai-service",
        "gemini_configured": bool(settings.gemini_api_key),
        "rag": {
            "total_chunks": stats.get("total_chunks", 0),
            "total_files": stats.get("total_files", 0),
        }
    }


@app.get("/")
async def root():
    return {
        "message": "Car Rental AI Service",
        "docs": "/docs",
        "health": "/health",
        "version": "1.1.0 (RAG enabled)",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )