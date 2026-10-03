from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Cấu hình AI Service."""
    
    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-flash"
    backend_url: str = "http://localhost:8080/api/v1"
    host: str = "0.0.0.0"
    port: int = 8000
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()