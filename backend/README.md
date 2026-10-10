# 🚗 Car Rental System — Backend API

Hệ thống Backend RESTful API cho nền tảng thuê xe trực tuyến **Car Rental System**, được xây dựng bằng **Spring Boot 3** và **Java 21**, tuân thủ mô hình kiến trúc **Modular Monolith (Package-by-Feature)**.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

* **Framework:** Spring Boot 3.x (Spring Web, Spring Security, Spring Data JPA, Spring Validation)
* **Ngôn ngữ:** Java 21 (LTS)
* **Cơ sở dữ liệu:** PostgreSQL 16+
* **Database Migration:** Flyway (27 versioned migration scripts `V1` ➔ `V27`)
* **Caching & Session:** Redis 7+
* **Xác thực & Phân quyền:** JSON Web Token (JWT — HMAC SHA-256)
* **Thanh toán:** Tích hợp cổng thanh toán MoMo (MomoGateway với chữ ký bảo mật HMAC SHA-256)
* **Tiện ích:** Lombok, MapStruct, Apache POI (Import Excel xe)
* **Build Tool:** Maven (sử dụng `./mvnw` wrapper)

---

## 📂 Cấu trúc thư mục (Package-by-Feature)

```
backend/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/carrental/
│   │   │   ├── CarRentalApplication.java      # Entry point ứng dụng
│   │   │   ├── admin/                         # Quản trị viên: dashboard thống kê, duyệt xe, duyệt chủ xe, duyệt rút tiền, cấu hình
│   │   │   ├── auth/                          # Xác thực: đăng ký, đăng nhập JWT, refresh token, quên mật khẩu OTP
│   │   │   ├── booking/                       # Đơn hàng: đặt xe, tính tiền cọc, duyệt đơn, hủy đơn, hoàn cọc
│   │   │   ├── car/                           # Quản lý xe: tìm kiếm, lọc xe, CRUD xe của chủ xe, import Excel 11 cột
│   │   │   ├── common/                        # Dùng chung: GlobalExceptionHandler, ApiResponse, JWT provider, upload file
│   │   │   ├── config/                        # Cấu hình: SecurityConfig (CORS, phân quyền), FlywayConfig, WebMvcConfig
│   │   │   ├── dispute/                       # Khiếu nại/Tranh chấp: biên bản sự cố, upload bằng chứng, phản bác 48h
│   │   │   ├── driver/                        # Quản lý tài xế của chủ xe, gán tài xế, xác nhận cuốc qua Magic Link
│   │   │   ├── handover/                      # Bàn giao xe (Pickup/Return): đối soát km, xăng, tự động tính phụ phí
│   │   │   ├── notification/                  # Hệ thống thông báo in-app (13+ types), đánh dấu đã đọc
│   │   │   ├── payment/                       # Giao dịch thanh toán: cọc, thanh toán kết thúc, MoMo callback
│   │   │   ├── review/                        # Đánh giá & xếp hạng sao cho xe/chuyến đi
│   │   │   └── user/                          # Hồ sơ người dùng, xác minh 5 ảnh GPLX/CCCD để thuê tự lái
│   │   └── resources/
│   │       ├── application.yml                # Cấu hình database, redis, port, jwt secret
│   │       └── db/migration/                  # 27 file SQL migration khởi tạo schema và seed data
│   └── test/                                  # Unit & Integration tests
```

---

## ⚙️ Yêu cầu môi trường & Cài đặt

### 1. Khởi động PostgreSQL và Redis bằng Docker
Tại thư mục gốc dự án:
```bash
docker-compose up -d
```
*Đảm bảo container `car-rental-db` (Postgres port 5432) và `car-rental-redis` (Redis port 6379) đang chạy.*

### 2. Cấu hình cấu trúc file `application.yml`
File cấu hình tại `src/main/resources/application.yml`:
* **PostgreSQL:** `jdbc:postgresql://localhost:5432/car_rental` (User: `postgres`, Password: `yourpassword`)
* **Flyway:** Tự động migrate schema khi khởi động.
* **Server Port:** `8080` (Base context-path: `/api/v1`)
* **JWT Secret:** 256-bit secret key (thời hạn access token 1h, refresh token 7 ngày).

### 3. Build và Chạy ứng dụng

#### Trên Windows (PowerShell):
```powershell
$env:JAVA_TOOL_OPTIONS="-Duser.timezone=Asia/Ho_Chi_Minh"
.\mvnw.cmd clean spring-boot:run
```

#### Trên Linux / macOS:
```bash
export JAVA_TOOL_OPTIONS="-Duser.timezone=Asia/Ho_Chi_Minh"
./mvnw clean spring-boot:run
```
Khi thấy dòng log `Tomcat started on port(s): 8080 (http) with context path '/api/v1'`, backend đã sẵn sàng.

---

## 📡 Danh mục REST API Endpoints cốt lõi

### 1. Xác thực & Tài khoản (`/api/v1/auth`)
* `POST /auth/register`: Đăng ký tài khoản (mặc định Role `CUSTOMER`)
* `POST /auth/login`: Đăng nhập, trả về Access Token + Refresh Token
* `POST /auth/refresh`: Cấp lại Access Token mới từ Refresh Token
* `POST /auth/forgot-password`: Yêu cầu gửi OTP khôi phục mật khẩu (in ra console)
* `POST /auth/reset-password`: Xác thực OTP và đặt lại mật khẩu mới

### 2. Quản lý Xe (`/api/v1/cars` & `/api/v1/owner/cars`)
* `GET /cars`: Tìm kiếm và lọc xe (hãng, số chỗ, giá, địa điểm, truyền động)
* `GET /cars/{id}`: Xem chi tiết xe và đánh giá
* `POST /owner/cars`: Chủ xe đăng tải xe mới (chờ Admin duyệt)
* `POST /owner/cars/import`: Nhập danh sách xe hàng loạt qua file Excel chuẩn 11 cột (A->K)
* `PUT /owner/cars/{id}` / `DELETE /owner/cars/{id}`: Chỉnh sửa / Xóa xe
* `PATCH /owner/cars/{id}/toggle-status`: Bật/tắt trạng thái Sẵn sàng của xe

### 3. Đơn đặt xe (`/api/v1/bookings`)
* `POST /bookings`: Khách tạo đơn thuê xe, tính tiền cọc (30%)
* `GET /bookings/my`: Danh sách chuyến đi của khách hàng
* `GET /bookings/owner`: Danh sách đơn đặt xe của Chủ xe
* `PUT /bookings/{id}/confirm` / `reject`: Chủ xe duyệt / từ chối đơn
* `POST /bookings/{id}/cancel`: Hủy đơn (tự động tính hoàn cọc theo thời gian hủy)

### 4. Bàn giao & Nhận lại xe (`/api/v1/handovers`)
* `POST /handovers/pickup`: Tạo biên bản bàn giao xe (chốt số km ban đầu, lượng xăng, ảnh ngoại quan)
* `POST /handovers/return`: Tạo biên bản nhận lại xe (tự động tính phí vượt km và phí phạt quá giờ)
* `PUT /handovers/{id}/sign`: Ký xác nhận biên bản điện tử

### 5. Thanh toán (`/api/v1/payments`)
* `POST /payments`: Tạo giao dịch thanh toán tiền cọc hoặc thanh toán nốt đơn thuê
* `POST /payments/callback/momo`: Webhook IPN xử lý kết quả thanh toán từ MoMo

### 6. Khiếu nại / Tranh chấp (`/api/v1/disputes`)
* `POST /disputes`: Khởi tạo tranh chấp kèm bằng chứng
* `POST /disputes/{id}/counter`: Bên bị khiếu nại phản bác trong 48 giờ
* `POST /admin/disputes/{id}/resolve`: Admin ban hành phán quyết và tạo hợp đồng tranh chấp PDF

### 7. Quản trị hệ thống (`/api/v1/admin`)
* `GET /admin/dashboard/stats`: Thống kê doanh thu sàn, thực nhận sau hoa hồng, tỉ lệ hủy, chỉ số CSAT
* `GET /admin/owner-requests`: Danh sách yêu cầu đăng ký làm chủ xe
* `PUT /admin/owner-requests/{id}/approve` / `reject`: Duyệt nâng quyền `CUSTOMER` lên `OWNER`
* `PUT /admin/cars/{id}/approve` / `reject`: Duyệt xe mới
* `GET /admin/configs` & `PUT /admin/configs`: Cấu hình hoa hồng, phí rút tiền, phí quá km, phí trễ giờ

### 8. Tài xế & Magic Link (`/api/v1/driver`)
* `GET /driver/assignments/{token}`: Tài xế mở Magic Link xem thông tin chuyến
* `POST /driver/assignments/{token}/accept` / `reject`: Tài xế chấp nhận / từ chối cuốc

---

## 👥 Tài khoản mặc định để kiểm thử (Test Accounts)

Sau khi Flyway migrate script `V10__seed_users.sql` và `V11__fix_admin_password.sql`:
* **Admin:** SĐT: `0900000001` / Mật khẩu: `Admin@123`
* **Owner:** SĐT: `0900000002` / Mật khẩu: `Owner@123`
* **Customer:** SĐT: `0900000003` / Mật khẩu: `Customer@123`
