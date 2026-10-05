from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ChatRequest(BaseModel):
    """Request gửi tin nhắn cho chatbot."""
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class CarSuggestion(BaseModel):
    """Gợi ý xe."""
    id: int
    name: str
    price_per_day: int
    thumbnail: Optional[str] = None
    link: Optional[str] = None


class ChatResponse(BaseModel):
    """Response từ chatbot."""
    reply: str
    intent: Optional[str] = None
    session_id: Optional[str] = None
    entities: Optional[Dict[str, Any]] = None
    cars: Optional[List[CarSuggestion]] = None
    suggestions: Optional[List[str]] = None


class HistoryMessage(BaseModel):
    """1 tin nhắn trong lịch sử."""
    role: str
    content: str
    at: str


class HistoryResponse(BaseModel):
    """Lịch sử chat."""
    session_id: str
    messages: List[HistoryMessage]


class FeedbackRequest(BaseModel):
    """Đánh giá phản hồi chatbot."""
    rating: str
    comment: Optional[str] = None