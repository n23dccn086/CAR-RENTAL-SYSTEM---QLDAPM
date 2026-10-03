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

Trả lời bằng tiếng Việt, thân thiện, ngắn gọn, dễ hiểu.
Nếu không biết, nói: "Tôi chưa có thông tin về vấn đề này, vui lòng liên hệ hotline 1900-xxxx."
"""


def generate_reply(user_message: str, history: list = None) -> dict:
    """Gọi Gemini để sinh câu trả lời."""
    if not settings.gemini_api_key:
        return {
            "reply": "AI service chưa được cấu hình. Vui lòng liên hệ admin.",
            "intent": "error"
        }
    
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
        response = chat.send_message(user_message)
        
        return {
            "reply": response.text,
            "intent": "general"
        }
    except Exception as e:
        return {
            "reply": f"Xin lỗi, AI đang bận. Vui lòng thử lại sau. (Lỗi: {str(e)})",
            "intent": "error"
        }


def detect_intent(message: str) -> str:
    """Phát hiện intent đơn giản bằng keyword."""
    msg = message.lower()
    
    if any(kw in msg for kw in ["tìm xe", "thuê xe", "gợi ý xe", "xe 7 chỗ", "xe 4 chỗ"]):
        return "search_car"
    if any(kw in msg for kw in ["chính sách", "hủy cọc", "hoàn tiền", "vượt km", "vượt thời gian"]):
        return "policy_inquiry"
    if any(kw in msg for kw in ["đơn", "booking", "cr-", "trạng thái"]):
        return "check_booking"
    if any(kw in msg for kw in ["sự cố", "tai nạn", "hỏng xe", "va chạm", "khẩn cấp"]):
        return "emergency"
    
    return "general"