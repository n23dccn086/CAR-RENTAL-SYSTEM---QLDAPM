# 💻 Car Rental System — Frontend Web Application

Giao diện người dùng nền tảng thuê xe trực tuyến **Car Rental System (MAISON)**, được phát triển bằng **React 18** và **Vite**, mang phong cách thiết kế thẩm mỹ cao, hỗ trợ phân quyền động theo Role và tích hợp Trợ lý ảo AI Concierge.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

* **Core:** React 18, JavaScript (ES Modules)
* **Build Tool:** Vite 8.x (Hot Module Replacement cực nhanh)
* **Styling:** Vanilla CSS (Custom Design System, Typography Serif/Sans-serif cổ điển & sang trọng, Glassmorphism, Micro-animations)
* **Routing:** React Router DOM v6
* **HTTP Client:** Axios (kèm Interceptor truyền JWT Token tự động)
* **Hiệu ứng:** Canvas Confetti, CSS Animations

---

## 📂 Cấu trúc thư mục

```
frontend/
├── index.html                         # HTML template chính
├── vite.config.js                     # Cấu hình Vite dev server và build
├── package.json                       # Khai báo dependencies và scripts
├── src/
│   ├── main.jsx                       # Entry point ứng dụng React
│   ├── App.jsx                        # Quản lý Routing và phân quyền bảo vệ tuyến đường (ProtectedRoute)
│   ├── components/                    # Thành phần giao diện tái sử dụng
│   │   ├── WheelNav.jsx               # Thanh điều hướng Navbar chính thích ứng theo từng Role
│   │   ├── Concierge.jsx              # Widget Trợ lý AI trò chuyện nổi góc màn hình
│   │   ├── HandoverFormModal.jsx      # Modal ký biên bản bàn giao và nhận lại xe
│   │   └── Footer.jsx                 # Chân trang thông tin liên hệ và chính sách
│   ├── pages/                         # Các trang giao diện chức năng
│   │   ├── HomePage.jsx               # Trang chủ giới thiệu, bộ sưu tập xe nổi bật
│   │   ├── SearchPage.jsx             # Tìm kiếm & bộ lọc xe (hãng, số chỗ, địa điểm, giá)
│   │   ├── CarDetailPage.jsx          # Chi tiết xe, thông số kỹ thuật, đánh giá review
│   │   ├── BookingPage.jsx            # Form đặt xe (tự lái hoặc chọn tài xế), tính cọc
│   │   ├── BookingDetailPage.jsx      # Chi tiết đơn, biên bản giao nhận, nút thanh toán
│   │   ├── MyBookingsPage.jsx         # Lịch sử chuyến đi của khách hàng
│   │   ├── OwnerDashboard.jsx         # Dashboard thu nhập và lượt thuê của Chủ xe
│   │   ├── OwnerCarsPage.jsx          # Quản lý xe, khóa/mở xe, nhập hàng loạt qua Excel
│   │   ├── CreateCarPage.jsx          # Đăng tải cỗ xe mới
│   │   ├── CarEditPage.jsx            # Sửa thông tin xe
│   │   ├── OwnerBookingsPage.jsx      # Danh sách đơn khách đặt xe của Chủ xe
│   │   ├── OwnerDriversPage.jsx       # Quản lý danh sách tài xế của Chủ xe
│   │   ├── OwnerRegisterPage.jsx      # Form nộp hồ sơ xin nâng quyền làm Chủ xe
│   │   ├── AdminDashboard.jsx         # Dashboard quản trị: CSAT, doanh thu sàn, hồ sơ chờ duyệt
│   │   ├── AdminOwnerRequestsPage.jsx # Danh sách xét duyệt hồ sơ chủ xe mới
│   │   ├── AdminDriversPage.jsx       # Quản lý và duyệt tài xế
│   │   ├── HandoverPage.jsx           # Quản lý biên bản giao/nhận xe
│   │   ├── PaymentPage.jsx            # Trang thanh toán tiền cọc / thanh toán nốt đơn
│   │   ├── NotificationsPage.jsx      # Hộp thông báo in-app, lọc theo phân loại
│   │   ├── LoginPage.jsx              # Đăng nhập hệ thống
│   │   ├── ForgotPasswordPage.jsx     # Yêu cầu gửi mã OTP khôi phục mật khẩu
│   │   └── ResetPasswordPage.jsx      # Nhập mã OTP và đặt lại mật khẩu mới
│   ├── services/                      # Tầng giao tiếp REST API
│   │   ├── api.js                     # Cấu hình Axios Base Instance
│   │   ├── authService.js             # API Auth (Login, Register, OTP)
│   │   ├── carService.js              # API Xe (Search, Detail, Owner CRUD, Excel Import)
│   │   ├── bookingService.js          # API Đơn hàng (Create, Confirm, Cancel, My bookings)
│   │   ├── handoverService.js         # API Bàn giao xe (Pickup, Return, Sign)
│   │   ├── ownerRegistrationService.js# API Đăng ký và Duyệt chủ xe
│   │   ├── withdrawalService.js       # API Doanh thu và Rút tiền
│   │   ├── verificationService.js     # API Xác minh 5 ảnh GPLX/CCCD
│   │   ├── configService.js           # API Cấu hình biểu phí
│   │   └── aiService.js               # API Kết nối AI Chatbot Service
│   └── styles/                        # File CSS định kiểu hệ thống
```

---

## ⚙️ Cài đặt & Khởi chạy ứng dụng

### 1. Cài đặt các gói phụ thuộc
Tại thư mục `frontend`:
```bash
npm install
```

### 2. Thiết lập Biến môi trường (`.env`)
Tạo hoặc kiểm tra file `.env` tại thư mục `frontend`:
```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_AI_URL=http://localhost:8000
```

### 3. Chạy môi trường phát triển (Dev Server)
```bash
npm run dev
```
Truy cập trình duyệt tại địa chỉ: `http://localhost:5173` (hoặc cổng được Vite cung cấp).

### 4. Build đóng gói cho Production
```bash
npm run build
```
Thư mục xuất bản tĩnh sẽ nằm trong thư mục `dist/`.

---

## 🧭 Các luồng trải nghiệm người dùng chính

1. **Khách hàng (`CUSTOMER` / `GUEST`):**
   * Tìm kiếm xe theo bộ sưu tập, chọn ngày thuê, hình thức thuê (Tự lái / Có tài xế).
   * Thuê xe tự lái: Bắt buộc nộp 5 ảnh GPLX + CCCD để Admin duyệt trước khi đặt xe.
   * Thanh toán cọc 30% qua MoMo ➔ Chờ chủ xe duyệt ➔ Ký biên bản giao xe (Pickup) ➔ Ký biên bản trả xe (Return) ➔ Thanh toán nốt số tiền còn lại và phụ phí (nếu có).
2. **Chủ xe (`OWNER`):**
   * Nộp hồ sơ đăng ký đối tác (Owner Request) và được Admin phê duyệt.
   * Quản lý xe: Nhập xe lẻ hoặc nhập hàng loạt từ file Excel `.xlsx` 11 cột.
   * Duyệt đơn khách đặt, tạo biên bản giao nhận xe, kiểm tra km/xăng.
   * Theo dõi thu nhập sau trừ hoa hồng sàn và tạo lệnh rút tiền về tài khoản ngân hàng.
3. **Quản trị viên (`ADMIN`):**
   * Theo dõi chỉ số toàn sàn: Doanh thu sàn, thực nhận nền tảng, tỉ lệ hủy đơn, điểm CSAT trung bình.
   * Duyệt xe mới, duyệt đăng ký chủ xe, duyệt xác minh giấy tờ khách hàng.
   * Phân xử tranh chấp/khiếu nại, cấu hình biểu phí sàn.
4. **Trợ lý AI Concierge:**
   * Widget tròn góc phải dưới màn hình có mặt trên mọi trang.
   * Tự động nhận diện Role và trả lời chính xác quy trình, hỗ trợ tra cứu đơn hàng và gợi ý xe thông minh.
