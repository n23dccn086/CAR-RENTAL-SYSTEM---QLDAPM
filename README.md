# 🚗 CAR RENTAL SYSTEM (QLDAPM)

> **Hệ thống Quản lý và Cho thuê xe trực tuyến hiện đại với kiến trúc phân tán 3 tầng (Backend, Frontend, AI Service)**  
> Dự án môn học: *Quản lý Dự án Phần mềm (QLDAPM)*

[![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%204.0%20%2F%20Java%2021-brightgreen.svg)](backend)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208-blue.svg)](frontend)
[![FastAPI](https://img.shields.io/badge/AI%20Service-FastAPI%20%2B%20Gemini%20RAG-orange.svg)](ai-service)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2015-blue.svg)](docker-compose.yml)
[![Redis](https://img.shields.io/badge/Cache-Redis%207-red.svg)](docker-compose.yml)

---

## 📌 Mục lục

1. [Tổng quan dự án](#-tổng-quan-dự-án)
2. [Kiến trúc hệ thống (3 thành phần chính)](#-kiến-trúc-hệ-thống)
3. [Các vai trò người dùng (Roles & Workflow)](#-các-vai-trò-người-dùng)
4. [Cấu trúc thư mục dự án](#-cấu-trúc-thư-mục-dự-án)
5. [Yêu cầu môi trường (Prerequisites)](#-yêu-cầu-môi-trường)
6. [Hướng dẫn cài đặt & Khởi chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
   - [Bước 1: Khởi động Hạ tầng (Docker Compose)](#bước-1-khởi-động-hạ-tầng-docker-compose)
   - [Bước 2: Khởi động Backend (Spring Boot)](#bước-2-khởi-động-backend-spring-boot)
   - [Bước 3: Khởi động Frontend (React + Vite)](#bước-3-khởi-động-frontend-react--vite)
   - [Bước 4: Khởi động AI Concierge Service (Python FastAPI)](#bước-4-khởi-động-ai-concierge-service-python-fastapi)
7. [Tài liệu API & Kỹ thuật bổ sung](#-tài-liệu-api--kỹ-thuật-bổ-sung)

---

## 📖 Tổng quan dự án

**Car Rental System** là nền tảng kết nối trực tuyến giữa **Khách thuê xe**, **Chủ xe đối tác**, **Đội ngũ Tài xế** và **Ban Quản trị sàn (Admin)**:
* Hỗ trợ 2 hình thức: **Thuê xe tự lái** và **Thuê xe có tài xế**.
* Quy trình đặt cọc, thanh toán online (VNPay), xét duyệt đơn hàng, xác minh danh tính giấy tờ GPLX/CCCD.
* Quy trình giao - nhận xe chặt chẽ với **Biên bản bàn giao điện tử (Handover Record)**, chụp ảnh hiện trạng xe và ký chữ ký số trên màn hình cảm ứng / chuột.
* Cơ chế tự động tính **Phí trả muộn (Late Fee)** và **Phí vượt giới hạn quãng đường (Km Overage Fee)** đa bậc theo ngày/dòng xe.
* Cơ chế khiếu nại, giải trình và **xét duyệt hoàn tiền cọc linh hoạt** cho khách hàng khi hủy chuyến.
* Tích hợp **Trợ lý ảo thông minh (AI Concierge)** tư vấn xe và giải đáp chính sách dựa trên RAG (Retrieval-Augmented Generation).

---

## 🏗️ Kiến trúc hệ thống

Hệ thống được chia thành **3 dịch vụ / thư mục độc lập**:

```
                       ┌─────────────────────────┐
                       │   Frontend (React 19)   │
                       │   Port: 5173 (Vite)     │
                       └───────────┬─────────────┘
                                   │ HTTP / REST / WebSocket
          ┌────────────────────────┴────────────────────────┐
          ▼                                                 ▼
┌─────────────────────────┐                       ┌─────────────────────────┐
│  Backend (Spring Boot)  │◄────── HTTP API ──────┤   AI Service (FastAPI)  │
│  Java 21 / Port: 8080   │      (Verify JWT,     │   Python / Port: 8000   │
└───────────┬─────────────┘       Live Data)      └───────────┬─────────────┘
            │                                                 │
    ┌───────┴───────┐                                 ┌───────┴───────┐
    ▼               ▼                                 ▼               ▼
PostgreSQL 15    Redis 7                           ChromaDB      Google Gemini
 (Database)   (Cache/Auth)                        (Vector RAG)    (LLM API)
```

### 1. ⚙️ `backend/` — Core Business API (Spring Boot 3 / Java 21)
* **Framework:** Spring Boot 4.0.8, Java 21.
* **Bảo mật:** Spring Security 6, JWT (JJWT 0.12.6) với cơ chế Refresh Token & Redis Blacklist.
* **Cơ sở dữ liệu:** PostgreSQL 15, Spring Data JPA, Flyway Database Migration.
* **Lưu trữ ảnh & chữ ký:** Cloudinary SDK.
* **Giao tiếp thời gian thực:** Spring WebSocket STOMP (thông báo realtime).
* **Tiện ích:** Apache POI (Import/Export xe dạng file Excel), Apache PDFBox (Xuất biên bản bàn giao, hợp đồng).

### 2. 🎨 `frontend/` — Giao diện người dùng (React 19 + Vite 8)
* **Framework:** React 19, Vite 8, React Router v7, Zustand Store.
* **Phong cách giao diện:** Phong cách Đông Dương sang trọng (Indochine / Vintage Editorial Aesthetic) với typography Serif kết hợp Monospace, bảng màu HSL cao cấp.
* **Tính năng UI:**
  - Bảng điều khiển phân quyền riêng biệt: Khách hàng, Chủ xe, Tài xế, Quản trị viên.
  - Bộ ký chữ ký điện tử trực tiếp trên màn hình (`SignatureCanvas`).
  - Hệ thống Modal / Popup xác nhận và ghi chú thay thế hoàn toàn browser alert mặc định (`DialogContext`).
  - Widget AI Chatbot tương tác nổi mọi trang.

### 3. 🤖 `ai-service/` — Trợ lý ảo AI Concierge (Python FastAPI)
* **Framework:** FastAPI, Uvicorn, Python 3.11+.
* **Mô hình ngôn ngữ:** Google Gemini API (`gemini-1.5-flash`).
* **Vector Database & RAG:** ChromaDB kết hợp mô hình embedding `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`.
* **Phân quyền ngữ cảnh:** Tự động giải mã JWT Role của người dùng (`GUEST`, `CUSTOMER`, `OWNER`, `ADMIN`) để trả lời đúng thẩm quyền và gọi API sang Backend lấy số liệu thực.

---

## 👥 Các vai trò người dùng

| Vai trò | Mô tả chức năng chính |
| :--- | :--- |
| **GUEST (Khách vãng lai)** | Xem danh sách xe, xem đánh giá/CSAT xe, đăng ký, đăng nhập, chat với AI tư vấn thuê xe. |
| **CUSTOMER (Khách thuê)** | Nộp hồ sơ xác minh CCCD/GPLX, đặt xe, thanh toán tiền cọc, xem chi tiết chuyến đi, ký biên bản nhận xe / trả xe điện tử, thanh toán quyết toán cuối, đánh giá xe & chủ xe, hủy chuyến và yêu cầu hoàn cọc (khiếu nại giải trình khi bị từ chối). |
| **OWNER (Chủ xe đối tác)** | Quản lý danh sách xe, đăng xe thủ công hoặc import hàng loạt bằng file Excel, duyệt / từ chối đơn thuê, lập biên bản giao nhận xe kèm ảnh chụp và chỉ số ODO/xăng, quản lý tài xế, theo dõi doanh thu và tạo lệnh rút tiền về ngân hàng. |
| **DRIVER (Tài xế)** | Tiếp nhận yêu cầu cuốc xe có tài xế, xác nhận / từ chối nhận chuyến, theo dõi lộ trình và thông tin khách hàng. |
| **ADMIN (Quản trị viên sàn)** | Xem thống kê doanh thu, CSAT toàn sàn; duyệt / từ chối hồ sơ xe mới, hồ sơ chủ xe, tài xế; duyệt / từ chối yêu cầu hoàn cọc; duyệt lệnh rút tiền; điều chỉnh cấu hình biểu phí nền tảng (phí quá giờ, giới hạn km, phí nền tảng); kiểm duyệt đánh giá. |

---

## 📂 Cấu trúc thư mục dự án

```
CAR-RENTAL-SYSTEM---QLDAPM/
├── backend/                       # 1. Mã nguồn Backend API (Spring Boot 3)
│   ├── src/main/java/com/carrental/
│   │   ├── admin/                 # Phân hệ quản trị (Duyệt xe, User, Config, Doanh thu)
│   │   ├── auth/                  # Xác thực, đăng ký, JWT
│   │   ├── booking/               # Nghiệp vụ đặt xe, hủy đơn, hoàn cọc
│   │   ├── car/                   # Quản lý xe, lịch bận, Excel import/export
│   │   ├── common/                # Exception handling, Security filter, Base DTO
│   │   ├── driver/                # Phân công & quản lý tài xế
│   │   ├── handover/              # Biên bản bàn giao, chữ ký, phí vượt giờ/km
│   │   ├── notification/          # Hệ thống thông báo & WebSocket
│   │   ├── payment/               # Tích hợp thanh toán cọc & quyết toán, hoàn tiền
│   │   ├── review/                # Hệ thống đánh giá xe, CSAT, phản hồi
│   │   └── user/                  # Quản lý tài khoản, hồ sơ GPLX/CCCD
│   ├── src/main/resources/
│   │   ├── db/migration/          # 23+ Flyway SQL Migration scripts
│   │   └── application.yml        # Cấu hình Database, Redis, Cloudinary, Mail
│   ├── pom.xml                    # Maven dependencies
│   └── mvnw / mvnw.cmd            # Maven wrapper
│
├── frontend/                      # 2. Mã nguồn Giao diện (React 19 + Vite)
│   ├── src/
│   │   ├── components/            # Header, Footer, HandoverFormModal, SignatureCanvas, WheelNav...
│   │   ├── context/               # AuthContext, DialogContext (Custom Alert/Prompt/Confirm)
│   │   ├── pages/                 # HomePage, CarDetailPage, MyBookingsPage, HandoverPage,
│   │   │                          # OwnerBookingsPage, AdminDashboard, AdminRefundsPage, AdminReviewsPage...
│   │   ├── services/              # Axios API clients (api, bookingService, handoverService...)
│   │   ├── App.jsx                # Định tuyến React Router v7
│   │   └── index.css              # Design System phong cách Đông Dương sang trọng
│   ├── package.json               # NPM packages & scripts
│   └── vite.config.js             # Cấu hình Vite dev server & proxy
│
├── ai-service/                    # 3. Mã nguồn Trợ lý ảo AI Concierge (Python FastAPI)
│   ├── app/
│   │   ├── api/                   # Router Chatbot API & RAG ingestion
│   │   ├── core/                  # Đọc cấu hình biến môi trường
│   │   ├── rag/                   # ChromaDB vector store, Chunking & Embedding pipeline
│   │   └── services/              # Gemini Client, Backend Integration Service
│   ├── data/documents/            # 13 Bộ quy chuẩn tri thức nghiệp vụ (.md)
│   ├── main.py                    # Điểm khởi chạy ứng dụng FastAPI
│   └── requirements.txt           # Thư viện Python (FastAPI, Chromadb, Google-GenerativeAI)
│
├── docker-compose.yml             # Docker compose khởi chạy PostgreSQL 15 & Redis 7
├── openapi.yaml                   # Đặc tả kỹ thuật OpenAPI 3.0 cho toàn bộ Backend
├── api contract.pdf               # Tài liệu đặc tả API hợp đồng
├── CAR RENTAL SYSTEM-QLDAPM.pdf   # Tài liệu báo cáo dự án QLDAPM
└── README.md                      # Tài liệu hướng dẫn này
```

---

## 💻 Yêu cầu môi trường

Để chạy đầy đủ cả 3 thành phần của dự án, máy tính cần cài đặt:
* **Java Development Kit (JDK):** Phiên bản **21** trở lên.
* **Node.js:** Phiên bản **18.x** hoặc **20.x** trở lên (kèm `npm`).
* **Python:** Phiên bản **3.11** hoặc **3.12**.
* **Docker & Docker Compose:** Dùng để chạy nhanh PostgreSQL và Redis.
* **Git:** Quản lý mã nguồn.

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### Bước 1: Khởi động Hạ tầng (Docker Compose)

Tại thư mục gốc dự án (`CAR-RENTAL-SYSTEM---QLDAPM/`):

```bash
# Khởi động PostgreSQL 15 (Port 5432) và Redis 7 (Port 6379)
docker-compose up -d

# Kiểm tra container đang chạy:
docker ps
```

---

### Bước 2: Khởi động Backend (Spring Boot)

1. Mở terminal và chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```

2. Tạo hoặc cấu hình file `.env` (hoặc cấu hình trong `src/main/resources/application.yml`):
   ```properties
   DB_URL=jdbc:postgresql://localhost:5432/car_rental
   DB_USERNAME=postgres
   DB_PASSWORD=yourpassword
   REDIS_HOST=localhost
   REDIS_PORT=6379
   JWT_SECRET=your_super_secret_key_at_least_256_bits_long_here
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. Biên dịch và khởi chạy Spring Boot:
   ```bash
   # Dành cho Windows:
   .\mvnw.cmd spring-boot:run

   # Dành cho Linux / macOS:
   ./mvnw spring-boot:run
   ```
   * Ứng dụng Backend sẽ chạy tại: **`http://localhost:8080`**
   * Flyway sẽ tự động chạy các script migration tạo bảng và seed dữ liệu mẫu ban đầu.

---

### Bước 3: Khởi động Frontend (React + Vite)

1. Mở một cửa sổ terminal mới và chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```

2. Cài đặt các gói phụ thuộc (Dependencies):
   ```bash
   npm install
   ```

3. Khởi chạy máy chủ phát triển Vite:
   ```bash
   npm run dev
   ```
   * Ứng dụng Frontend sẽ chạy tại: **`http://localhost:5173`**
   * Truy cập trình duyệt và bắt đầu trải nghiệm hệ thống!

---

### Bước 4: Khởi động AI Concierge Service (Python FastAPI)

1. Mở một cửa sổ terminal mới và chuyển vào thư mục `ai-service`:
   ```bash
   cd ai-service
   ```

2. Tạo môi trường ảo Python (Virtual Environment) và kích hoạt:
   ```bash
   # Windows:
   python -m venv venv
   .\venv\Scripts\activate

   # Linux / macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Cài đặt các thư viện cần thiết:
   ```bash
   pip install -r requirements.txt
   ```

4. Cấu hình file `.env` từ file mẫu:
   ```bash
   cp .env.example .env
   ```
   Điền khóa `GEMINI_API_KEY` của bạn:
   ```properties
   GEMINI_API_KEY=AIzaSy...
   BACKEND_URL=http://localhost:8080
   PORT=8000
   ```

5. Khởi chạy FastAPI server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   * Dịch vụ AI sẽ chạy tại: **`http://localhost:8000`**
   * Tài liệu Swagger UI của AI Service: **`http://localhost:8000/docs`**
   * Khi khởi động, AI Service sẽ tự động chunking và nạp 13 bộ tài liệu nghiệp vụ vào ChromaDB.

---

## 📚 Tài liệu API & Kỹ thuật bổ sung

* **OpenAPI 3.0 Specification:** Xem toàn bộ danh sách 60+ API endpoints chi tiết tại file [`openapi.yaml`](openapi.yaml).
* **Tài liệu Hợp đồng API:** Xem file [`api contract.pdf`](api%20contract.pdf).
* **Báo cáo phân tích dự án QLDAPM:** Xem file [`CAR RENTAL SYSTEM-QLDAPM.pdf`](CAR%20RENTAL%20SYSTEM-QLDAPM.pdf).
* **AI Service Documentation:** Xem tài liệu kiến trúc RAG chuyên sâu tại [`ai-service/README.md`](ai-service/README.md).

---

## 👨‍💻 Tác giả & Đóng góp
Dự án được phát triển và duy trì bởi nhóm sinh viên môn **Quản lý Dự án Phần mềm (QLDAPM)**.  
Mọi đóng góp, báo lỗi hoặc yêu cầu tính năng vui lòng tạo issue hoặc pull request trên kho lưu trữ.
