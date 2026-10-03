from fastapi import APIRouter
from app.models.schemas import (
    ChatRequest, ChatResponse, HistoryResponse,
    HistoryMessage, FeedbackRequest
)
from app.services.llm_service import generate_reply, detect_intent
from datetime import datetime
from uuid import uuid4

router = APIRouter(prefix="/ai", tags=["AI Chatbot"])

_sessions: dict = {}


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Gửi tin nhắn cho chatbot."""
    session_id = request.session_id or str(uuid4())
    
    history = _sessions.get(session_id, [])
    intent = detect_intent(request.message)
    result = generate_reply(request.message, history)
    
    history.append({
        "role": "user",
        "content": request.message,
        "at": datetime.now().isoformat()
    })
    history.append({
        "role": "bot",
        "content": result["reply"],
        "at": datetime.now().isoformat()
    })
    _sessions[session_id] = history
    
    return ChatResponse(
        reply=result["reply"],
        intent=intent,
        suggestions=[
            "Tìm xe 7 chỗ đi Đà Lạt",
            "Chính sách hủy cọc",
            "Kiểm tra đơn hàng"
        ]
    )


@router.get("/chat/{session_id}/history", response_model=HistoryResponse)
async def get_history(session_id: str):
    """Lấy lịch sử chat."""
    history = _sessions.get(session_id, [])
    messages = [
        HistoryMessage(role=m["role"], content=m["content"], at=m["at"])
        for m in history
    ]
    return HistoryResponse(session_id=session_id, messages=messages)


@router.post("/chat/{message_id}/feedback")
async def feedback(message_id: str, request: FeedbackRequest):
    """Đánh giá phản hồi chatbot."""
    return {"success": True, "message": "Cảm ơn phản hồi của bạn"}