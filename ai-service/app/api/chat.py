from fastapi import APIRouter, Header
from app.models.schemas import (
    ChatRequest, ChatResponse, HistoryResponse,
    HistoryMessage, FeedbackRequest
)
from app.services.llm_service import (
    generate_reply, detect_intent, decode_role_from_token, SUGGESTIONS_BY_ROLE
)
from app.services.backend_client import (
    get_my_bookings, search_cars, get_owner_bookings, get_admin_stats
)
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
    "07-huong-dan-chu-xe-quan-ly-xe": [
        "thêm xe", "nhập excel", "file excel", "quản lý xe",
        "khóa xe", "mở khóa xe", "11 cột", "cột excel", "chuẩn excel"
    ],
    "08-quy-trinh-duyet-don-va-giao-nhan-xe-owner": [
        "duyệt đơn", "từ chối đơn", "biên bản giao xe", "biên bản nhận xe",
        "pickup", "giao xe", "nhận xe", "gán tài xế", "magic link"
    ],
    "09-doanh-thu-va-rut-tien-owner": [
        "doanh thu chủ xe", "rút tiền", "lệnh rút", "yêu cầu rút tiền",
        "số dư khả dụng", "đang chờ rút", "phí rút tiền"
    ],
    "10-quy-trinh-xet-duyet-va-quan-tri-admin": [
        "duyệt xe admin", "duyệt chủ xe", "owner request", "nâng role",
        "xác minh gplx", "xác minh cccd", "duyệt rút tiền"
    ],
    "11-quy-trinh-giai-quyet-tranh-chap-admin": [
        "tranh chấp", "khiếu nại", "giải quyết tranh chấp", "bằng chứng",
        "phản bác 48h", "bổ sung 24h", "hợp đồng tranh chấp", "dispute"
    ],
    "12-cau-hinh-nen-tang-va-chi-so-admin": [
        "doanh thu sàn", "csat", "thực nhận nền tảng", "tỉ lệ hủy",
        "cấu hình nền tảng", "cấu hình sàn", "hoa hồng sàn"
    ],
    "13-huong-dan-xac-thuc-tai-khoan-va-khieu-nai": [
        "xác thực tài khoản", "5 ảnh", "thuê tự lái cần", "đăng ký làm chủ xe",
        "tạo tranh chấp", "khách khiếu nại"
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
    """Gửi tin nhắn cho chatbot. Nhận diện Role qua JWT để tối ưu hóa câu trả lời và tra cứu dữ liệu."""
    session_id = request.session_id or str(uuid4())
    history = _sessions.get(session_id, [])

    # ===== Extract JWT và Role =====
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()

    role = decode_role_from_token(token)
    intent = detect_intent(request.message, role=role)

    # ===== Gọi backend nếu cần theo Role & Intent =====
    context = {}

    if intent == "check_booking" and token:
        bookings = await get_my_bookings(token)
        if bookings and not (isinstance(bookings, dict) and bookings.get("error")):
            context["bookings"] = bookings

    elif intent == "check_owner_booking" and token:
        obookings = await get_owner_bookings(token)
        if obookings and not (isinstance(obookings, dict) and obookings.get("error")):
            context["owner_bookings"] = obookings

    elif intent == "check_admin_stats" and token:
        astats = await get_admin_stats(token)
        if astats and not (isinstance(astats, dict) and astats.get("error")):
            context["admin_stats"] = astats

    elif intent == "search_car":
        cars = await search_cars()
        if cars and not (isinstance(cars, dict) and cars.get("error")):
            context["cars"] = cars

    # ===== RAG: retrieve knowledge base cho policy / emergency / general / operation =====
    source_filter = _detect_source_filter(request.message)
    if source_filter or intent in ("policy_inquiry", "emergency", "general", "check_revenue"):
        try:
            rag_context = retrieve_by_source(
                request.message,
                source_filter=source_filter,
                top_k=30,
            )
            if rag_context:
                context["rag"] = rag_context
                print(
                    f"[Chat] [{role}] RAG retrieved {len(rag_context)} chars "
                    f"(source: {source_filter or 'similarity'})"
                )
        except Exception as e:
            print(f"[Chat] RAG retrieve failed: {e}")

    # ===== Gọi Gemini với context và role tương ứng =====
    result = generate_reply(request.message, history, context, role=role)

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

    suggestions = SUGGESTIONS_BY_ROLE.get(role, SUGGESTIONS_BY_ROLE["GUEST"])

    return ChatResponse(
        reply=result["reply"],
        intent=intent,
        role=role,
        session_id=session_id,
        suggestions=suggestions
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