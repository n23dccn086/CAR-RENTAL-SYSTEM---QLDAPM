# Car Rental AI Service

AI Chatbot cho hệ thống Car Rental System.

## Tech Stack
- Python 3.11+
- FastAPI
- Google Gemini API
- Uvicorn

## Cài đặt

### 1. Cài Python dependencies
pip install -r requirements.txt

### 2. Cấu hình API key
- Copy `.env.example` → `.env`
- Điền `GEMINI_API_KEY`

### 3. Chạy service
python main.py

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/ai/chat` | Gửi tin nhắn |
| GET | `/ai/chat/{session_id}/history` | Lịch sử chat |
| POST | `/ai/chat/{message_id}/feedback` | Đánh giá |
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI |