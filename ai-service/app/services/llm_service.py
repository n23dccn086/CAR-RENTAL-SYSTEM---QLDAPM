import google.generativeai as genai
from app.core.config import get_settings

settings = get_settings()

if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)


SYSTEM_PROMPT = """Bạn là trợ lý AI của hệ thống Car Rental System — nền tảng đặt xe và thuê xe trực tuyến.

Nhiệm vụ:
1. Gợi ý xe phù hợp theo yêu cầu của khách
2. Tư vấn thủ tục, chính sách thuê xe
3. Tra cứu thông tin đơn hàng
4. Hỗ trợ sự cố khẩn cấp

Chính sách hoàn cọc:
- Hủy trước 24h nhận xe: hoàn 100%
- Hủy trong 24h nhận xe: hoàn 70%
- Hủy trong 4h nhận xe: hoàn 50%
- Hủy sau khi nhận xe: không hoàn

Quy định vượt km:
- Sedan: 300km/ngày, phí vượt 5,000đ/km
- SUV: 350km/ngày, phí vượt 7,000đ/km
- MPV: 400km/ngày, phí vượt 8,000đ/km
- Xe cao cấp: 250km/ngày, phí vượt 10,000đ/km

Quy định vượt thời gian:
- Vượt dưới 15 phút: miễn phí
- Vượt 15p - 1h: 100,000đ/giờ
- Vượt 1h - 4h: 50% giá thuê ngày
- Vượt 4h - 24h: 100% giá thuê ngày
- Vượt trên 24h: theo ngày + phạt 20%

Khi có thêm "TÀI LIỆU THAM KHẢO" trong context, hãy ưu tiên dùng thông tin đó để trả lời.
Nếu tài liệu tham khảo không đề cập, mới dùng kiến thức chung.
Nếu vẫn không biết, nói: "Tôi chưa có thông tin về vấn đề này, vui lòng liên hệ hotline 1900-xxxx."

Trả lời bằng tiếng Việt, thân thiện, ngắn gọn, dễ hiểu.
"""


def generate_reply(user_message: str, history: list = None, context: dict = None) -> dict:
    """Gọi Gemini để sinh câu trả lời, có inject context từ backend + RAG."""
    if not settings.gemini_api_key:
        return {
            "reply": "AI service chưa được cấu hình. Vui lòng liên hệ admin.",
            "intent": "error"
        }

    # ===== Build backend context string =====
    backend_context = ""

    if context:
        # Inject bookings
        if "bookings" in context:
            bookings = context["bookings"]
            if isinstance(bookings, list) and len(bookings) > 0:
                backend_context += "\n\n### ĐƠN HÀNG CỦA KHÁCH:\n"
                for b in bookings[:5]:
                    backend_context += (
                        f"- Đơn #{b.get('id')}: {b.get('carName', 'N/A')} "
                        f"({b.get('carPlate', '')}), "
                        f"từ {str(b.get('startDate', ''))[:10]} đến {str(b.get('endDate', ''))[:10]}, "
                        f"trạng thái: {b.get('status')}, "
                        f"tổng: {b.get('totalPrice', 0):,}đ\n"
                    )
            else:
                backend_context += "\n\n### KHÁCH CHƯA CÓ ĐƠN HÀNG NÀO.\n"

        # Inject cars
        if "cars" in context:
            cars = context["cars"]
            if isinstance(cars, list) and len(cars) > 0:
                backend_context += "\n\n### DANH SÁCH XE CÓ SẴN:\n"
                for c in cars[:10]:
                    backend_context += (
                        f"- {c.get('brand')} {c.get('model')} "
                        f"({c.get('seats')} chỗ, {c.get('transmission')}), "
                        f"giá: {c.get('pricePerDay', 0):,}đ/ngày\n"
                    )

        # Inject RAG (knowledge base chính sách, FAQ, quy trình)
        if "rag" in context and context["rag"]:
            backend_context += context["rag"]

    try:
        model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            system_instruction=SYSTEM_PROMPT
        )

        chat_history = []
        if history:
            for msg in history:
                role = "user" if msg.get("role") == "user" else "model"
                chat_history.append({
                    "role": role,
                    "parts": [msg.get("content", "")]
                })

        chat = model.start_chat(history=chat_history)

        # ===== Inject context vào message =====
        full_message = user_message
        if backend_context:
            full_message = (
                f"{backend_context}\n\n"
                f"Dựa vào thông tin trên, hãy trả lời câu hỏi sau của khách "
                f"một cách chính xác và tự nhiên: {user_message}"
            )

        response = chat.send_message(full_message)

        return {
            "reply": response.text,
            "intent": "general"
        }
    except Exception as e:
        print(f"[LLM] Error: {str(e)[:300]}")
        return {
            "reply": "Xin lỗi, AI đang bận. Vui lòng thử lại sau ạ.",
            "intent": "error"
        }


def detect_intent(message: str) -> str:
    """Phát hiện intent đơn giản bằng keyword."""
    msg = message.lower()

    # ===== BOOKING =====
    if any(kw in msg for kw in [
        "đơn hàng", "đơn của tôi", "chuyến đi của tôi",
        "booking", "đơn #", "kiểm tra đơn", "trạng thái đơn"
    ]):
        return "check_booking"

    # ===== POLICY / FAQ / PROCEDURE (ưu tiên CAO) =====
    # Đặt TRƯỚC search_car vì câu hỏi về giấy tờ/quy trình
    # thường chứa từ "thuê xe" nhưng KHÔNG phải là tìm xe.
    if any(kw in msg for kw in [
        # Chính sách
        "chính sách", "hủy cọc", "hoàn tiền", "hoàn cọc",
        "vượt km", "vượt thời gian", "vượt giờ", "quy định",
        # Bảo mật
        "bảo mật", "quyền", "cookie", "dữ liệu", "thông tin cá nhân",
        # Quy trình / thủ tục
        "đặt xe", "quy trình", "thủ tục", "các bước",
        # Giấy tờ / FAQ
        "giấy tờ", "cần gì", "cần những gì", "yêu cầu gì",
        "câu hỏi thường gặp", "faq", "hỏi đáp",
        "gplx", "bằng lái", "cccd", "cmnd",
        # Chung
        "làm sao", "làm thế nào", "như thế nào", "ra sao",
        "bao lâu", "bao nhiêu", "thế nào",
        # Xe / bảo hiểm
        "bảo hiểm", "đổi xe", "trả xe", "nhận xe",
        "thuê dài hạn", "thanh toán",
    ]):
        return "policy_inquiry"

    # ===== SEARCH CAR =====
    if any(kw in msg for kw in [
        "tìm xe", "thuê xe", "gợi ý xe", "xe 7 chỗ",
        "xe 4 chỗ", "danh sách xe", "có xe nào"
    ]):
        return "search_car"

    # ===== EMERGENCY =====
    if any(kw in msg for kw in [
        "sự cố", "tai nạn", "hỏng xe", "va chạm", "khẩn cấp"
    ]):
        return "emergency"

    return "general"