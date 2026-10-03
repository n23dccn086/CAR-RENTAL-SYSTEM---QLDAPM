from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Car Rental AI Service",
    description="AI Chatbot cho hệ thống Car Rental System",
    version="1.0.0"
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
    return {
        "status": "healthy",
        "service": "ai-service",
        "gemini_configured": bool(settings.gemini_api_key)
    }


@app.get("/")
async def root():
    return {
        "message": "Car Rental AI Service",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )