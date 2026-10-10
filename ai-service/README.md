# 🤖 Car Rental System — AI Concierge Service

Dịch vụ Trợ lý thông minh (AI Concierge) cho hệ thống **Car Rental System**, được xây dựng bằng **Python**, **FastAPI**, **Google Gemini LLM** và kỹ thuật **RAG (Retrieval-Augmented Generation)** với **ChromaDB**.

Dịch vụ có khả năng tự động nhận diện vai trò người dùng (**GUEST**, **CUSTOMER**, **OWNER**, **ADMIN**) từ JWT Token để phản hồi chính xác phạm vi nghiệp vụ và gợi ý các câu hỏi phù hợp.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

* **Ngôn ngữ:** Python 3.11+
* **Framework:** FastAPI, Uvicorn (ASGI Server)
* **Mô hình ngôn ngữ lớn (LLM):** Google Gemini API (`gemini-1.5-flash`)
* **Vector Database (RAG):** ChromaDB (lưu trữ persistent embeddings)
* **Mô hình Embeddings:** `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (hỗ trợ tiếng Việt đa ngôn ngữ xuất sắc)
* **HTTP Client:** `httpx` (gọi bất đồng bộ sang Spring Boot Backend)
* **Validation & Schemas:** Pydantic v2

---

## 🌟 Tính năng nổi bật

### 1. Phản hồi cá nhân hóa theo từng Role
* **`GUEST` (Khách vãng lai):** Chào đón, tư vấn tìm xe, giải thích quy trình thuê xe, giấy tờ cần chuẩn bị và hướng dẫn đăng ký tài khoản.
* **`CUSTOMER` (Khách thuê xe):** Tra cứu đơn hàng thời gian thực qua API `/bookings/my`, hướng dẫn nhận/trả xe và ký biên bản giao nhận, giải thích phí vượt km/quá giờ, hướng dẫn khiếu nại.
* **`OWNER` (Đối tác Chủ xe):** Hướng dẫn đăng xe thủ công & chuẩn file Excel 11 cột (A->K), tra cứu đơn khách đặt qua API `/bookings/owner`, hướng dẫn lập biên bản giao nhận xe, tư vấn doanh thu và lệnh rút tiền.
* **`ADMIN` (Quản trị viên sàn):** Tra cứu thống kê toàn sàn qua API `/admin/dashboard/stats` (Doanh thu sàn, thực nhận, CSAT, tỉ lệ hủy), hướng dẫn quy trình duyệt xe/chủ xe, trọng tài giải quyết tranh chấp (hạn 48h phản bác, 24h bổ sung chứng cứ, xuất biên bản PDF).

### 2. Kho tri thức RAG với 13 Bộ Tài liệu Chuẩn hóa
Nạp tự động từ thư mục `data/documents/`:
1. `01-chinh-sach-hoan-coc.md`: Chính sách hoàn tiền cọc theo mốc thời gian hủy (100%, 70%, 50%, 0%).
2. `02-quy-dinh-vuot-km.md`: Mức giới hạn km/ngày và đơn giá phạt theo từng dòng xe (Sedan, SUV, MPV, xe sang).
3. `03-quy-dinh-vuot-thoi-gian.md`: 5 bậc xử lý trả xe trễ hạn (dưới 15p miễn phí, 15p-1h tính theo giờ, 1h-4h phạt 50%, 4h-24h phạt 100%, trên 24h phạt 120%).
4. `04-quy-trinh-dat-xe.md`: Quy trình 7 bước đặt thuê xe trực tuyến chuẩn.
5. `05-cau-hoi-thuong-gap.md`: Giải đáp các thắc mắc phổ biến về giấy tờ, thanh toán.
6. `06-chinh-sach-bao-mat.md`: Quy định bảo mật thông tin cá nhân và dữ liệu chuyến đi.
7. `07-huong-dan-chu-xe-quan-ly-xe.md`: Quy chuẩn 11 cột Excel import xe và cơ chế khóa/mở xe.
8. `08-quy-trinh-duyet-don-va-giao-nhan-xe-owner.md`: Quy trình duyệt đơn và lập 2 biên bản giao nhận.
9. `09-doanh-thu-va-rut-tien-owner.md`: Quy định hoa hồng sàn, số dư khả dụng và lệnh rút tiền.
10. `10-quy-trinh-xet-duyet-va-quan-tri-admin.md`: Tiêu chuẩn duyệt xe, duyệt chủ xe mới và duyệt rút tiền.
11. `11-quy-trinh-giai-quyet-tranh-chap-admin.md`: Quy trình phân xử khiếu nại và xuất hợp đồng tranh chấp.
12. `12-cau-hinh-nen-tang-va-chi-so-admin.md`: Công thức tính CSAT tổng hợp và cấu hình biểu phí sàn.
13. `13-huong-dan-xac-thuc-tai-khoan-va-khieu-nai.md`: Hướng dẫn nộp 5 ảnh GPLX/CCCD để thuê tự lái.

---

## 📂 Cấu trúc thư mục

```
ai-service/
├── main.py                     # Khởi chạy FastAPI, cấu hình CORS, lifespans & startup RAG
├── requirements.txt            # Danh mục thư viện Python
├── .env.example                # File mẫu biến môi trường
├── README.md                   # Tài liệu hướng dẫn dịch vụ
├── app/
│   ├── api/
│   │   └── chat.py             # Router REST API cho Chatbot & RAG management
│   ├── core/
│   │   └── config.py           # Cấu hình đọc .env (GEMINI_API_KEY, BACKEND_URL, PORT)
│   ├── models/
│   │   └── schemas.py          # Schemas Pydantic (ChatRequest, ChatResponse, v.v.)
│   └── services/
│       ├── llm_service.py      # Quản lý 4 System Prompts theo Role, gọi Gemini, detect intent
│       ├── rag_service.py      # Chia chunk, đánh chỉ mục và truy xuất dữ liệu từ ChromaDB
│       └── backend_client.py   # Client httpx bất đồng bộ gọi sang Spring Boot Backend
├── data/
│   ├── documents/              # 13 file Markdown tri thức nguồn
│   └── chroma_db/              # CSDL vector ChromaDB lưu trữ nhị phân
└── tests/
    └── test_chat.py            # Unit tests cho endpoint /health và /ai/chat
```

---

## ⚙️ Cài đặt & Khởi chạy

### 1. Tạo môi trường ảo và cài đặt thư viện
```bash
# Tạo môi trường ảo Python
python -m venv .venv

# Kích hoạt môi trường ảo:
# Trên Windows:
.venv\Scripts\activate
# Trên Linux/macOS:
source .venv/bin/activate

# Cài đặt dependencies:
pip install -r requirements.txt
```

### 2. Cấu hình biến môi trường (`.env`)
Tạo file `.env` tại thư mục `ai-service`:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
BACKEND_URL=http://localhost:8080/api/v1
HOST=0.0.0.0
PORT=8000
```

### 3. Chạy AI Service
```bash
python main.py
```
Hoặc chạy thông qua uvicorn trực tiếp:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Khi khởi động, service sẽ tự động đọc toàn bộ tài liệu trong `data/documents/` và nạp chỉ mục vector vào ChromaDB.

---

## 📡 Danh mục API Endpoints

| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| **POST** | `/ai/chat` | Gửi tin nhắn đến chatbot (nhận JWT ở Header `Authorization: Bearer <token>` để nhận diện Role) |
| **GET** | `/ai/chat/{session_id}/history` | Lấy danh sách lịch sử tin nhắn của phiên chat |
| **POST** | `/ai/chat/{message_id}/feedback` | Đánh giá sao phản hồi của AI |
| **POST** | `/ai/rag/reindex` | Lệnh buộc (force) đánh chỉ mục lại toàn bộ tài liệu Markdown |
| **GET** | `/ai/rag/stats` | Xem số lượng chunks và các file tài liệu đang có trong Vector DB |
| **GET** | `/health` | Kiểm tra trạng thái hoạt động và cấu hình Gemini API |
| **GET** | `/docs` | Giao diện tài liệu tương tác Swagger UI |