from fastapi import APIRouter, Header
from app.models.schemas import (
    ChatRequest, ChatResponse, HistoryResponse,
    HistoryMessage, FeedbackRequest
)
from app.services.llm_service import generate_reply, detect_intent
from app.services.backend_client import get_my_bookings, search_cars
from app.services.rag_service import retrieve_context
from datetime import datetime
from uuid import uuid4

router = APIRouter(prefix="/ai", tags=["AI Chatbot"])

_sessions: dict = {}


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    authorization: str = Header(None)
):
    """Gửi tin nhắn cho chatbot. Nhận JWT để tra cứu dữ liệu backend."""
    session_id = request.session_id or str(uuid4())
    history = _sessions.get(session_id, [])
    intent = detect_intent(request.message)

    # ===== Extract JWT từ header =====
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]

    # ===== Gọi backend nếu cần =====
    context = {}

    if intent == "check_booking" and token:
        # User hỏi về đơn hàng → gọi backend lấy danh sách đơn
        bookings = await get_my_bookings(token)
        if bookings and not (isinstance(bookings, dict) and bookings.get("error")):
            context["bookings"] = bookings

    elif intent == "search_car":
        # User tìm xe → gọi backend lấy danh sách xe (public)
        cars = await search_cars()
        if cars and not (isinstance(cars, dict) and cars.get("error")):
            context["cars"] = cars

    # ===== RAG: retrieve knowledge base cho policy / emergency / general =====
    # (Không chạy cho check_booking vì intent đó cần data realtime từ backend)
    if intent in ("policy_inquiry", "emergency", "general"):
        try:
            rag_context = retrieve_context(request.message, top_k=3)
            if rag_context:
                context["rag"] = rag_context
                print(f"[Chat] RAG retrieved {len(rag_context)} chars for: {request.message[:50]}")
        except Exception as e:
            print(f"[Chat] RAG retrieve failed: {e}")

    # ===== Gọi Gemini với context =====
    result = generate_reply(request.message, history, context)

    # ===== Lưu history =====
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
        session_id=session_id,
        suggestions=[
            "Đơn hàng của tôi thế nào?",
            "Tìm xe 7 chỗ",
            "Chính sách hủy cọc",
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