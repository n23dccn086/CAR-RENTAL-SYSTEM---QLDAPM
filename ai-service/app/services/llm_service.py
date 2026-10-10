import base64
import json
import google.generativeai as genai
from app.core.config import get_settings

settings = get_settings()

if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)


def decode_role_from_token(token: str | None) -> str:
    """Decode role người dùng từ JWT token (không cần secret key ở AI service)."""
    if not token:
        return "GUEST"
    try:
        clean_token = token.replace("Bearer ", "").strip()
        parts = clean_token.split(".")
        if len(parts) >= 2:
            payload = parts[1]
            padding = 4 - len(payload) % 4
            if padding < 4:
                payload += "=" * padding
            decoded_bytes = base64.urlsafe_b64decode(payload)
            data = json.loads(decoded_bytes.decode("utf-8"))
            role = data.get("role", "CUSTOMER")
            if role in ("ADMIN", "OWNER", "CUSTOMER"):
                return role
    except Exception as e:
        print(f"[Auth] Decode token role error: {e}")
    return "CUSTOMER"


SHARED_POLICY_RULES = """
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

===== QUY TẮC BẮT BUỘC =====
1. **ƯU TIÊN TÀI LIỆU THAM KHẢO**: Khi có "TÀI LIỆU THAM KHẢO" trong context, BẮT BUỘC dùng thông tin đó để trả lời. Không tự bịa.
2. **GIỮ NGUYÊN SỐ THỨ TỰ BƯỚC**: Nếu tài liệu có "Bước 1, Bước 2, ... Bước N", PHẢI liệt kê ĐẦY ĐỦ tất cả các bước với số thứ tự GỐC (không tự đánh số lại).
3. **LIỆT KÊ ĐẦY ĐỦ**: Không được bỏ sót bước nào trong quy trình.
4. **KHÔNG GỘP BƯỚC**: Không gộp 2 bước thành 1. Giữ đúng cấu trúc tài liệu.
5. **FALLBACK**: Nếu tài liệu tham khảo không đề cập, mới dùng kiến thức chung. Nếu vẫn không biết, nói: "Tôi chưa có thông tin về vấn đề này, vui lòng liên hệ hotline 1900-xxxx."
Trả lời bằng tiếng Việt, thân thiện, ngắn gọn, dễ hiểu, đi thẳng vào câu trả lời.
"""

ROLE_SYSTEM_PROMPTS = {
    "GUEST": f"""Bạn là trợ lý AI (Concierge) của hệ thống Car Rental System — nền tảng đặt và thuê xe trực tuyến.
Đối tượng đang trò chuyện: KHÁCH VÃNG LAI (GUEST - chưa đăng nhập).

Nhiệm vụ của bạn:
1. Chào đón khách, tư vấn tìm kiếm và gợi ý các dòng xe nổi bật trong bộ sưu tập (Sedan, SUV, MPV, xe gia đình...).
2. Hướng dẫn quy trình thuê xe, các giấy tờ cần chuẩn bị (GPLX, CCCD để thuê tự lái).
3. Giải thích các chính sách cơ bản: quy định đặt cọc, hủy cọc, phụ phí vượt km và thời gian.
4. Hướng dẫn khách đăng ký tài khoản (tài khoản mặc định là CUSTOMER) hoặc đăng nhập để tiến hành đặt xe.
{SHARED_POLICY_RULES}
""",

    "CUSTOMER": f"""Bạn là trợ lý AI chăm sóc khách hàng của hệ thống Car Rental System.
Đối tượng đang trò chuyện: KHÁCH HÀNG THUÊ XE (CUSTOMER - đã đăng nhập).

Nhiệm vụ của bạn:
1. Gợi ý xe phù hợp với nhu cầu của khách (số chỗ, loại xe, tự lái hoặc có tài xế).
2. Tra cứu, theo dõi và giải thích trạng thái đơn hàng / chuyến đi của khách.
3. Hướng dẫn quy trình nhận xe và trả xe: ký biên bản bàn giao (odo, lượng xăng, ảnh hiện trạng) và biên bản nhận xe.
4. Giải thích chi tiết các khoản thanh toán: tiền cọc, số tiền còn lại, phụ phí phát sinh (quá km, quá giờ nếu có).
5. Hướng dẫn thủ tục hủy đơn & nhận hoàn tiền cọc, hoặc hướng dẫn tạo khiếu nại/tranh chấp nếu có sự cố chuyến đi.
{SHARED_POLICY_RULES}
""",

    "OWNER": f"""Bạn là trợ lý AI dành riêng cho ĐỐI TÁC CHỦ XE (OWNER) trên hệ thống Car Rental System.
Đối tượng đang trò chuyện: CHỦ XE (OWNER).

Nhiệm vụ của bạn:
1. Hướng dẫn quản lý xe: thêm xe thủ công, import danh sách xe hàng loạt qua file Excel (.xlsx 11 cột chuẩn A->K), bật/tắt trạng thái Sẵn sàng / Đang được thuê.
2. Hướng dẫn quản lý đơn đặt xe: duyệt hoặc từ chối đơn của khách, lưu ý thời hạn phản hồi đơn.
3. Hướng dẫn quy trình bàn giao xe (Pickup) và nhận lại xe (Return): lập biên bản, chốt số km và xăng ban đầu, đối soát khi nhận lại để tự động tính phụ phí vượt km và phí trả trễ.
4. Giải đáp về doanh thu, % hoa hồng sàn, số dư khả dụng và quy trình gửi lệnh rút tiền (Tiền thực nhận = Tiền rút - Phí rút).
5. Hướng dẫn quản lý tài xế thuộc quyền quản lý của chủ xe (thêm tài xế, khóa tài xế pending_lock, gửi magic link nhận chuyến).
6. Hướng dẫn xử lý khiếu nại/tranh chấp từ khách hàng: gửi bằng chứng phản bác trong 48h.
{SHARED_POLICY_RULES}
""",

    "ADMIN": f"""Bạn là trợ lý AI hỗ trợ QUẢN TRỊ VIÊN HỆ THỐNG (ADMIN) của Car Rental System.
Đối tượng đang trò chuyện: QUẢN TRỊ VIÊN (ADMIN).

Nhiệm vụ của bạn:
1. Hỗ trợ theo dõi và giải thích các chỉ số vận hành trên Dashboard: Doanh thu sàn, thực nhận sàn (% hoa hồng x doanh thu), tỉ lệ hủy, chỉ số CSAT tổng hợp.
2. Hướng dẫn các quy trình xét duyệt: duyệt xe mới của chủ xe, duyệt hồ sơ nâng cấp tài khoản chủ xe (OwnerRequest), duyệt hồ sơ xác minh GPLX/CCCD của khách hàng.
3. Hướng dẫn cơ chế trọng tài giải quyết tranh chấp (Dispute): xem xét chứng cứ 2 bên, yêu cầu bổ sung chứng cứ trong 24h, quyết định bồi thường/hoàn tiền và xuất hợp đồng tranh chấp PDF.
4. Giải thích các thiết lập cấu hình nền tảng (Platform Config): tỉ lệ hoa hồng sàn, phí rút tiền, các bậc cấu hình phạt vượt km và biểu phí trả trễ giờ.
5. Hướng dẫn quy trình xác nhận hoàn tiền cọc (Refund) khi khách hoặc chủ xe hủy đơn theo các mốc thời gian quy định.
{SHARED_POLICY_RULES}
"""
}

SUGGESTIONS_BY_ROLE = {
    "GUEST": [
        "Quy trình thuê xe gồm mấy bước?",
        "Cần giấy tờ gì để thuê xe tự lái?",
        "Chính sách hủy cọc và hoàn tiền?",
    ],
    "CUSTOMER": [
        "Đơn hàng của tôi thế nào?",
        "Tìm xe 7 chỗ gia đình",
        "Biên bản bàn giao xe gồm những gì?",
    ],
    "OWNER": [
        "Quy trình duyệt đơn cho khách",
        "Cách lập biên bản giao nhận xe",
        "Quy định rút tiền doanh thu",
    ],
    "ADMIN": [
        "Quy trình giải quyết tranh chấp",
        "Tiêu chuẩn duyệt hồ sơ chủ xe",
        "Cách tính doanh thu sàn và CSAT",
    ],
}

# Compatibility alias
SYSTEM_PROMPT = ROLE_SYSTEM_PROMPTS["GUEST"]


def generate_reply(user_message: str, history: list = None, context: dict = None, role: str = "GUEST") -> dict:
    """Gọi Gemini để sinh câu trả lời dựa trên role, có inject context từ backend + RAG."""
    if not settings.gemini_api_key:
        return {
            "reply": "AI service chưa được cấu hình. Vui lòng liên hệ admin.",
            "intent": "error"
        }

    # Chọn System Instruction theo Role
    system_instruction = ROLE_SYSTEM_PROMPTS.get(role, ROLE_SYSTEM_PROMPTS["GUEST"])

    # ===== Build backend context string =====
    backend_context = ""

    if context:
        # 1. Customer bookings
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

        # 2. Owner bookings
        if "owner_bookings" in context:
            obookings = context["owner_bookings"]
            if isinstance(obookings, list) and len(obookings) > 0:
                backend_context += "\n\n### CÁC ĐƠN ĐẶT XE CỦA CHỦ XE:\n"
                for b in obookings[:5]:
                    backend_context += (
                        f"- Đơn #{b.get('id')}: Xe {b.get('carName', 'N/A')} "
                        f"(Khách: {b.get('customerName', 'Khách hàng')}), "
                        f"từ {str(b.get('startDate', ''))[:10]} đến {str(b.get('endDate', ''))[:10]}, "
                        f"trạng thái: {b.get('status')}, "
                        f"tiền thuê: {b.get('totalPrice', 0):,}đ\n"
                    )
            else:
                backend_context += "\n\n### HIỆN CHƯA CÓ ĐƠN ĐẶT XE MỚI.\n"

        # 3. Admin dashboard stats
        if "admin_stats" in context and isinstance(context["admin_stats"], dict):
            st = context["admin_stats"]
            backend_context += (
                f"\n\n### THỐNG KÊ TOÀN SÀN (ADMIN DASHBOARD):\n"
                f"- Tổng doanh thu sàn: {st.get('totalRevenue', 0):,}đ\n"
                f"- Thực nhận nền tảng: {st.get('platformRevenue', 0):,}đ\n"
                f"- Tỉ lệ hủy đơn: {st.get('cancellationRate', 0)}%\n"
                f"- Chỉ số CSAT trung bình: {st.get('csatAverage', 0)}/5\n"
            )

        # 4. Search Cars
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

        # 5. RAG knowledge base
        if "rag" in context and context["rag"]:
            backend_context += context["rag"]

    try:
        model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            system_instruction=system_instruction
        )

        chat_history = []
        if history:
            for msg in history:
                m_role = "user" if msg.get("role") == "user" else "model"
                chat_history.append({
                    "role": m_role,
                    "parts": [msg.get("content", "")]
                })

        chat = model.start_chat(history=chat_history)

        # ===== Inject context vào message =====
        full_message = user_message
        if backend_context:
            role_hint = {
                "GUEST": "khách vãng lai",
                "CUSTOMER": "khách thuê xe",
                "OWNER": "đối tác chủ xe",
                "ADMIN": "quản trị viên sàn",
            }.get(role, "người dùng")

            full_message = (
                f"{backend_context}\n\n"
                f"Dựa vào thông tin trên, hãy trả lời câu hỏi sau của {role_hint} "
                f"một cách chính xác, đúng vai trò và tự nhiên. "
                f"NẾU LÀ QUY TRÌNH NHIỀU BƯỚC, PHẢI LIỆT KÊ ĐẦY ĐỦ VÀ GIỮ NGUYÊN SỐ THỨ TỰ: "
                f"{user_message}"
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


def detect_intent(message: str, role: str = "GUEST") -> str:
    """Phát hiện intent đơn giản bằng keyword kết hợp vai trò (role)."""
    msg = message.lower()

    # ===== INTENT RIÊNG CHO OWNER =====
    if role == "OWNER":
        if any(kw in msg for kw in ["đơn hàng", "đơn của tôi", "đơn khách", "khách đặt", "danh sách đơn", "duyệt đơn", "đơn mới", "kiểm tra đơn"]):
            return "check_owner_booking"
        if any(kw in msg for kw in ["doanh thu", "thu nhập", "rút tiền", "hoa hồng", "số dư"]):
            return "check_revenue"
        if any(kw in msg for kw in ["nhập excel", "thêm xe", "quản lý xe", "tài xế", "khóa xe"]):
            return "policy_inquiry"

    # ===== INTENT RIÊNG CHO ADMIN =====
    if role == "ADMIN":
        if any(kw in msg for kw in ["thống kê", "doanh thu sàn", "doanh thu", "csat", "tỉ lệ hủy", "số liệu", "chỉ số", "báo cáo"]):
            return "check_admin_stats"
        if any(kw in msg for kw in ["tranh chấp", "khiếu nại", "duyệt xe", "duyệt chủ xe", "cấu hình", "biểu phí", "hoàn tiền"]):
            return "policy_inquiry"

    # ===== BOOKING DÀNH CHO CUSTOMER =====
    if any(kw in msg for kw in [
        "đơn hàng", "đơn của tôi", "chuyến đi của tôi",
        "booking", "đơn #", "kiểm tra đơn", "trạng thái đơn"
    ]):
        return "check_booking"

    # ===== POLICY / FAQ / PROCEDURE (ưu tiên CAO) =====
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
        "thuê dài hạn", "thanh toán", "biên bản"
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