from fastapi import APIRouter, Header
from app.models.schemas import (
    ChatRequest, ChatResponse, HistoryResponse,
    HistoryMessage, FeedbackRequest
)
from app.services.llm_service import generate_reply, detect_intent
from app.services.backend_client import get_my_bookings, search_cars
from app.services.rag_service import (
    retrieve_context,
    retrieve_by_source,
    index_documents,
    get_stats,
)
from datetime import datetime
from uuid import uuid4

router = APIRouter(prefix="/ai", tags=["AI Chatbot"])

_sessions: dict = {}


# ============================================================
# SOURCE FILTER MAP — map keyword → tên file .md
# ============================================================
SOURCE_FILTER_MAP = {
    "04-quy-trinh-dat-xe": [
        "quy trình đặt xe", "các bước đặt xe", "thủ tục đặt xe",
        "đặt xe như thế nào", "đặt xe gồm mấy bước", "quy trình thuê xe",
        "các bước thuê xe",
    ],
    "01-chinh-sach-hoan-coc": [
        "hoàn cọc", "hủy cọc", "chính sách hủy", "chính sách hoàn",
        "hủy đơn", "hoàn tiền cọc",
    ],
    "02-quy-dinh-vuot-km": [
        "vượt km", "vượt kilomet", "km vượt", "phí vượt km",
        "giới hạn km",
    ],
    "03-quy-dinh-vuot-thoi-gian": [
        "vượt thời gian", "trả muộn", "vượt giờ", "phí muộn",
        "trả xe muộn", "phí trả muộn",
    ],
    "05-cau-hoi-thuong-gap": [
        "câu hỏi thường gặp", "faq", "giấy tờ cần", "cần giấy tờ gì",
        "thủ tục cần", "yêu cầu giấy tờ",
    ],
    "06-chinh-sach-bao-mat": [
        "bảo mật", "privacy", "dữ liệu cá nhân", "chính sách bảo mật",
        "quyền riêng tư",
    ],
}


def _detect_source_filter(message: str) -> str:
    """Detect source filter từ message dựa trên SOURCE_FILTER_MAP."""
    msg_lower = message.lower()
    for source, keywords in SOURCE_FILTER_MAP.items():
        for kw in keywords:
            if kw in msg_lower:
                return source
    return None


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
        bookings = await get_my_bookings(token)
        if bookings and not (isinstance(bookings, dict) and bookings.get("error")):
            context["bookings"] = bookings

    elif intent == "search_car":
        cars = await search_cars()
        if cars and not (isinstance(cars, dict) and cars.get("error")):
            context["cars"] = cars

    # ===== RAG: retrieve knowledge base cho policy / emergency / general =====
    if intent in ("policy_inquiry", "emergency", "general"):
        try:
            # ★ Detect source filter từ message
            source_filter = _detect_source_filter(request.message)

            rag_context = retrieve_by_source(
                request.message,
                source_filter=source_filter,
                top_k=30,
            )
            if rag_context:
                context["rag"] = rag_context
                print(
                    f"[Chat] RAG retrieved {len(rag_context)} chars "
                    f"(source: {source_filter or 'similarity'})"
                )
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


# ===== RAG MANAGEMENT =====

@router.post("/rag/reindex")
async def reindex_rag(force: bool = True):
    """Force re-index toàn bộ tài liệu."""
    count = index_documents(force_reindex=force)
    return {"success": True, "chunks": count}


@router.get("/rag/stats")
async def rag_stats():
    """Xem thống kê RAG."""
    return get_stats()