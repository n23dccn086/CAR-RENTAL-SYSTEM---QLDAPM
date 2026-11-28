# Hướng dẫn Sử dụng — Car Rental System

| Thuộc tính | Giá trị |
|---|---|
| Đối tượng | Người cài đặt/demo hệ thống, Khách thuê, Chủ xe, Tài xế, Quản trị viên |
| Phiên bản | 1.0 (28/11/2026) |
| Tài liệu liên quan | `docs/srs.md` (quy tắc nghiệp vụ chi tiết), `README.md` |

---

## Phần A — Cài đặt và khởi chạy

### A.1 Yêu cầu
- JDK **21**, Node.js 18+ (kèm npm), Python **3.11+**, Docker + Docker Compose, Git.
- Khóa Google Gemini API (chỉ cần nếu dùng trợ lý AI).

### A.2 Bước 1 — Hạ tầng (PostgreSQL 15 + Redis 7)
Tại thư mục gốc dự án:
```bash
docker-compose up -d
docker ps      # thấy 2 container: car-rental-db (5432), car-rental-redis (6379)
```
`docker-compose.yml` tạo CSDL `car_rental`, user `postgres`. Mật khẩu trong `docker-compose.yml` phải trùng `PASSWORD_POSTGRES` trong file `.env` của backend (bản hiện tại đều là `123456`; nếu bạn dùng bản cũ có `yourpassword` thì sửa một trong hai cho khớp).

### A.3 Bước 2 — Backend (Spring Boot)
```bash
cd backend
cp .env.example .env          # Windows: copy .env.example .env
```
Các biến trong `backend/.env` (backend tự nạp file này khi khởi động):

| Nhóm | Biến | Mặc định | Ghi chú |
|---|---|---|---|
| PostgreSQL | `HOST_POSTGRES`, `PORT_POSTGRES`, `USER_POSTGRES`, `PASSWORD_POSTGRES`, `DB_POSTGRES`, `SSLMODE_POSTGRES` | localhost, 5432, postgres, 123456, car_rental, disable | Hoặc dùng `SPRING_DATASOURCE_URL/USERNAME/PASSWORD` để ghi đè |
| Redis | `HOST_REDIS`, `PORT_REDIS`, `PASSWORD_REDIS`, `DB_REDIS` | localhost, 6379, (trống), 0 | Hàng đợi tự hủy đơn + blacklist JWT |
| Server | `SERVER_PORT`, `SERVER_SERVLET_CONTEXT_PATH` | 8080, `/api/v1` | |
| JWT | `JWT_SECRET`, `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION` | (khóa demo), 3600000 (1 giờ), 604800000 (7 ngày) | Đổi `JWT_SECRET` khi triển khai thật |
| MoMo | `PAYMENT_MOMO_PARTNER_CODE`, `..._ACCESS_KEY`, `..._SECRET_KEY`, `..._ENDPOINT`, `..._RETURN_URL`, `..._NOTIFY_URL` | DEMO, sandbox | Với credential DEMO, thanh toán đi qua nút giả lập |
| File | `APP_UPLOAD_DIR` | `uploads` | Nơi lưu ảnh xe, giấy tờ, chữ ký |
| Frontend | `FRONTEND_URL` | `http://localhost:5173` | Dùng để dựng Magic Link gửi tài xế |

Chạy:
```bash
./mvnw spring-boot:run        # Windows: .\mvnw.cmd spring-boot:run
```
- API: `http://localhost:8080/api/v1`; Swagger UI: `http://localhost:8080/api/v1/swagger-ui.html`; kiểm tra sống: `GET /api/v1/health`.
- Flyway tự chạy migration V1…V38, tạo 24 bảng và dữ liệu mẫu.
- **Cửa sổ console backend** là nơi xem nội dung SMS giả lập (OTP quên mật khẩu, Magic Link tài xế). Hãy để cửa sổ này mở khi demo.

Chạy unit test: `./mvnw test` (test `contextLoads` cần PostgreSQL đang chạy).

### A.4 Bước 3 — Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```
Không bắt buộc file `.env`. Có thể đặt `VITE_API_URL` (mặc định `http://localhost:8080/api/v1`) và `VITE_AI_URL` (mặc định `http://localhost:8000`). Vite dev server đã proxy `/api`, `/files`, `/uploads` sang backend.

### A.5 Bước 4 — AI service (tùy chọn)
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate         # Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # điền GEMINI_API_KEY
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Biến `ai-service/.env`: `GEMINI_API_KEY`, `GEMINI_MODEL` (mặc định `gemini-2.5-flash`), `BACKEND_URL` (phải có `/api/v1`, mặc định `http://localhost:8080/api/v1`), `HOST`, `PORT`.
Lần đầu khởi động sẽ tải mô hình embedding và đánh chỉ mục 13 tài liệu vào ChromaDB (`ai-service/data/chroma_db`). Kiểm tra: `http://localhost:8000/health`, tài liệu API: `http://localhost:8000/docs`.

### A.6 Tài khoản mẫu
Mật khẩu chung: **`Admin@123`**. Đăng nhập bằng **số điện thoại**.

| Vai trò | Số điện thoại | Email |
|---|---|---|
| Quản trị viên | 0900000001 | admin@carrental.com |
| Chủ xe (có 14 xe, 3 tài xế mẫu) | 0900000002 | owner@carrental.com |
| Khách hàng (đã xác thực KYC) | 0900000003 | customer@carrental.com |

### A.7 Sự cố thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| Backend báo lỗi kết nối PostgreSQL | Kiểm tra container đang chạy và `PASSWORD_POSTGRES` khớp `POSTGRES_PASSWORD` trong `docker-compose.yml` |
| Không nhận được OTP / Magic Link | Hệ thống không gửi SMS thật — xem khung "MOCK SMS" trong console backend |
| Trợ lý AI không trả lời | Kiểm tra AI service đang chạy ở cổng 8000 và đã điền `GEMINI_API_KEY` |
| AI không tra cứu được đơn | Kiểm tra `BACKEND_URL` có hậu tố `/api/v1` và người dùng đã đăng nhập |
| Ảnh không hiển thị | Kiểm tra backend đang chạy (ảnh phục vụ qua `/api/v1/files/**`) |

---

## Phần B — Hướng dẫn theo vai trò

Thanh điều hướng (menu bánh xe) hiển thị chức năng theo vai trò đang đăng nhập. Biểu tượng thông báo tự cập nhật số tin chưa đọc **30 giây/lần**; trang `/notifications` cho phép đọc, đánh dấu đã đọc, xóa từng tin hoặc hàng loạt. Trợ lý AI là khung chat nổi ở mọi trang.

### B.1 Khách vãng lai và Khách hàng

**1. Đăng ký / đăng nhập**
- `/register`: nhập họ tên, số điện thoại (10–11 số), email (tùy chọn), mật khẩu ≥ 8 ký tự.
- `/login`: đăng nhập bằng số điện thoại + mật khẩu.
- Quên mật khẩu: `/forgot-password` → nhập số điện thoại → lấy mã OTP 6 số (trong console backend) → `/reset-password` nhập OTP và mật khẩu mới. OTP hết hạn sau 5 phút, sai tối đa 5 lần, gửi lại sau 60 giây.
- `/profile`: sửa họ tên, email, địa chỉ, ngày sinh; đổi mật khẩu.
- Đăng xuất: token hiện tại bị thu hồi, phải đăng nhập lại.

**2. Xác thực tài khoản (KYC)** — bắt buộc trước khi **thuê tự lái**
- `/verification`: tải 5 ảnh — GPLX mặt trước, GPLX mặt sau, CCCD mặt trước, CCCD mặt sau, ảnh chân dung — rồi bấm gửi. Trạng thái chuyển "Chờ duyệt"; Admin duyệt xong bạn nhận thông báo.
- Ảnh JPEG/PNG/WEBP/GIF, tối đa 5 MB mỗi ảnh.

**3. Tìm và xem xe**
- `/search` (hoặc `/cars`): lọc theo địa điểm, số chỗ, loại xe và sắp xếp; hệ thống chỉ có xe 4, 5, 7 chỗ.
- `/cars/:id`: ảnh, thông số, giá ngày thường/cuối tuần, đánh giá của khách trước.

**4. Đặt xe** — `/booking/:carId`
1. Chọn ngày giờ nhận và trả, hình thức thuê (tự lái / có tài xế), địa chỉ nhận/trả, có giao xe, có mua bảo hiểm hay không, ghi chú.
2. Xem bảng giá dự kiến: số ngày tính theo khối 24 giờ (làm tròn lên); ngày Thứ 7/Chủ nhật tính giá cuối tuần; bảo hiểm 100.000đ/ngày; tài xế 500.000đ/ngày; tiền cọc **30%**.
3. Thuê có tài xế: chọn tài xế hoặc để hệ thống tự chọn tài xế rảnh.
4. Xác nhận → đơn ở trạng thái **Chờ cọc**. Đơn giữ lịch xe **tối đa 12 giờ**; quá hạn chưa cọc sẽ tự hủy.

Lưu ý: không đặt được nếu trùng lịch đơn khác hoặc trùng ngày chủ xe đã chặn.

**5. Thanh toán cọc** — `/payment/:bookingId`
- Chọn phương thức và bấm thanh toán. Ở môi trường demo, giao dịch được **giả lập thành công** (không trừ tiền thật).
- Đơn chuyển **Đã cọc**, chủ xe nhận thông báo. Chủ xe có **4 giờ** để duyệt; quá hạn, đơn tự hủy và bạn được hoàn **100%** cọc.

**6. Theo dõi đơn** — `/my-bookings`, chi tiết `/bookings/:id`
- Xem trạng thái: Chờ cọc → Đã cọc → Đã duyệt → Đang thuê → Đã trả xe → Hoàn thành (hoặc Đã hủy), các khoản phí, biên bản, tài xế.

**7. Nhận xe và trả xe** — `/handover/:id`
- Khi giao xe, chủ xe lập **biên bản giao xe** (chỉ số ODO, nhiên liệu, ảnh hiện trạng, ghi chú) và ký. Bạn kiểm tra rồi **ký trên màn hình** → đơn chuyển **Đang thuê**.
- Khi trả xe, chủ xe lập **biên bản nhận lại xe**; hệ thống tự tính:
  - Phí trả trễ: dưới 15 phút miễn phí; 15–60 phút 100.000đ; 1–4 giờ ½ giá ngày; 4–24 giờ 1 giá ngày; mỗi 24 giờ trễ trọn = 120% giá ngày.
  - Phí vượt km: định mức 300 km/ngày; 50 km vượt đầu 5.000đ/km, 50 km tiếp 8.000đ/km, trên 100 km 12.000đ/km.
  - Phụ phí khác do chủ xe ghi (kèm lý do).
- Bạn ký biên bản trả xe → đơn **Đã trả xe**.

**8. Thanh toán quyết toán** — `/payment-final/:bookingId`
- Thanh toán số tiền còn lại (tổng tiền + phụ phí − tiền cọc). Xong → đơn **Hoàn thành**.

**9. Hủy đơn và hoàn cọc**
- Hủy được khi đơn ở Chờ cọc / Đã cọc / Đã duyệt (không hủy được khi đã nhận xe).
- Mức hoàn cọc theo thời gian còn lại tới giờ nhận xe: **≥ 24 giờ 100%**, **4–24 giờ 70%**, **< 4 giờ 50%**, sau giờ nhận 0%. Đơn chưa cọc thì không có khoản hoàn.
- Yêu cầu hoàn tiền chờ Admin duyệt; nếu bị từ chối có thể gửi lại yêu cầu từ trang đơn.

**10. Đánh giá** — `/review/:bookingId` (chỉ đơn Hoàn thành, mỗi đơn 1 lần)
- Chấm 1–5 sao cho xe, chủ xe (bắt buộc) và tài xế (nếu có); viết nhận xét, đính kèm ảnh, chọn **ẩn danh** nếu muốn.
- Khi chủ xe phản hồi, bạn có thể trả lời tiếp tại `/my-reviews/:reviewId` (hội thoại nhiều lượt).

**11. Tranh chấp** — `/disputes` (chỉ đơn Hoàn thành)
- Tạo khiếu nại: chọn loại (hư hỏng xe, trả muộn, vượt km, không nhận xe, thanh toán, thái độ, khác), mô tả, số tiền yêu cầu, ảnh bằng chứng.
- Nếu bạn là bên bị khiếu nại: trong **48 giờ** chọn **Chấp nhận** hoặc **Phản tố** kèm bằng chứng; quá hạn hệ thống coi như chấp nhận.
- Khi Admin yêu cầu bổ sung bằng chứng, bạn có **24 giờ** để nộp.
- Kết quả phán xử được thông báo, kèm biên bản PDF.

**12. Đăng ký làm chủ xe** — `/owner-register`
- Điền thông tin cá nhân, CCCD, tài khoản ngân hàng; tải ảnh CCCD 2 mặt và GPKD hoặc GPLX 2 mặt. Admin duyệt xong, tài khoản được nâng lên **Chủ xe** (đăng nhập lại để cập nhật menu).

**13. Trợ lý AI**
- Hỏi về chính sách (hoàn cọc, phí vượt km, trả trễ, giấy tờ, quy trình đặt xe…), nhờ gợi ý xe, hoặc khi đã đăng nhập hỏi "kiểm tra đơn của tôi" để AI liệt kê đơn thật của bạn.
- Khi gặp sự cố khẩn cấp, AI đưa ra hướng dẫn theo tài liệu; hệ thống chưa có chức năng chuyển tổng đài.

### B.2 Chủ xe

**1. Quản lý xe** — `/owner/cars`
- Thêm xe: `/cars/create` — biển số, hãng, dòng xe, năm sản xuất (1990–2100), số chỗ (4/5/7), loại xe, hộp số, nhiên liệu, màu, ODO, **giá ngày thường**, **giá cuối tuần T7/CN** (tùy chọn, để trống = giá thường), hình thức cho thuê, địa chỉ, mô tả, ảnh. Xe mới ở trạng thái **Chờ duyệt** cho tới khi Admin duyệt.
- Giá có tài xế, phí giao xe, phí vệ sinh: form chưa có ô nhập; cấu hình qua API `PUT /api/v1/cars/{id}/pricing` (Swagger UI).
- Sửa xe: `/cars/edit/:id`; đổi trạng thái (ví dụ tạm ngưng) hoặc xóa xe từ danh sách.
- **Chặn lịch**: cuối trang sửa xe, chọn ngày bắt đầu – kết thúc, lý do (Bảo dưỡng / Dùng riêng), ghi chú → **+ Thêm lịch chặn**; bấm **Gỡ chặn** để xóa. Khách không đặt được xe trong các ngày này và thấy chúng ở mục “Lịch đã kín” trên trang chi tiết xe.
- **Nhập từ Excel**: tải file `.xlsx` với 11 cột theo thứ tự: Biển số | Hãng | Model | Năm | Số chỗ | Loại xe (SEDAN, SUV, MPV, HATCHBACK, PICKUP, VAN, LUXURY) | Hộp số (AUTOMATIC, MANUAL) | Nhiên liệu (GASOLINE, DIESEL, ELECTRIC, HYBRID) | Giá/ngày | Địa chỉ | Mô tả. Hệ thống báo số dòng thành công và lỗi từng dòng.
- Giấy tờ xe: hiện chỉ có API (`POST /cars/{id}/documents`, thao tác qua Swagger UI); chưa có màn hình.

**2. Duyệt đơn** — `/owner/bookings`
- Đơn **Đã cọc** cần được duyệt trong **4 giờ** kể từ lúc khách cọc, nếu không sẽ tự hủy.
- **Duyệt**: đơn chuyển Đã duyệt; nếu đơn có tài xế, hệ thống gửi Magic Link cho tài xế.
- **Từ chối**: đơn bị hủy, khách được hoàn **100%** cọc.

**3. Giao xe và nhận lại xe**
- Từ đơn Đã duyệt, lập **biên bản giao xe**: ODO, mức nhiên liệu, ghi chú ngoại/nội thất, hư hỏng có sẵn, ảnh, chữ ký của bạn. Khách ký → Đang thuê. Với đơn có tài xế, chỉ lập được khi tài xế đã nhận chuyến.
- Khi khách trả xe, lập **biên bản nhận xe**: ODO trả (không được nhỏ hơn ODO lúc giao), nhiên liệu, hư hỏng, phụ phí kèm ghi chú. Form hiển thị trước phí trễ và phí vượt km; nếu số km vượt bất thường (quá 500 km/ngày) hệ thống yêu cầu kiểm tra lại ODO.

**4. Tài xế** — `/owner/drivers`
- Thêm/sửa/xóa tài xế (họ tên, SĐT, email, CCCD, số và hạng GPLX, ngày hết hạn, ngày sinh, địa chỉ, kinh nghiệm, ảnh). Tài xế mới chờ Admin duyệt mới được phân công.
- **Nhập từ Excel** 10 cột: Tên | SĐT | Email | CCCD | Số GPLX | Hạng GPLX | Ngày hết hạn GPLX | Ngày sinh | Địa chỉ | Số năm kinh nghiệm.
- Phân công: tài xế có **3 giờ** để nhận; quá hạn hoặc từ chối, hệ thống tự gán tài xế rảnh khác (tối đa 5 lượt).

**5. Đánh giá** — `/owner/reviews`: xem đánh giá về xe của bạn, phản hồi và trò chuyện tiếp với khách.

**6. Doanh thu và rút tiền**
- `/owner/dashboard`: thu nhập = tổng tiền các đơn Hoàn thành × 85% (sàn thu hoa hồng 15%), số đã rút, số đang chờ, số dư khả dụng.
- `/owner/withdrawals`: tạo lệnh rút (tối thiểu 100.000đ, không vượt số dư, cần ít nhất 1 đơn hoàn thành), nhập ngân hàng, số tài khoản, chủ tài khoản. Admin duyệt và chuyển khoản.

**7. Tranh chấp** — `/disputes`: thao tác như khách (mục B.1.11), có thể là bên khiếu nại hoặc bị khiếu nại.

### B.3 Tài xế (không có tài khoản web)
1. Khi được phân công, tài xế nhận tin nhắn chứa **Magic Link** dạng `http://localhost:5173/driver/assignment/<mã>?token=<token>`. Trong môi trường demo, tin nhắn được in trong console backend (khung "MOCK SMS - TIN NHAN GUI TAI XE"), người demo sao chép link mở trên trình duyệt.
2. Trang hiển thị thông tin chuyến: mã đơn, xe, thời gian, địa điểm, hạn phản hồi.
3. Bấm **Nhận chuyến** hoặc **Từ chối** (nhập lý do). Link chỉ có hiệu lực trong **3 giờ**.
4. Chưa hỗ trợ: xem danh sách lịch chạy, báo sự cố, xem thu nhập.

### B.4 Quản trị viên

| Trang | Chức năng |
|---|---|
| `/admin/dashboard` | Doanh thu sàn, thực nhận nền tảng, tỉ lệ hủy, điểm CSAT, số hồ sơ chờ duyệt; **quỹ cọc tạm giữ** |
| `/admin/approvals` | Duyệt / từ chối xe mới (kèm lý do) |
| `/admin/users` | Danh sách, thống kê người dùng; khóa / mở / xóa tài khoản; xem 5 ảnh KYC và **duyệt / từ chối xác thực** |
| `/admin/owner-requests` | Xem hồ sơ đăng ký chủ xe và ảnh giấy tờ; duyệt (nâng quyền Chủ xe) / từ chối |
| `/admin/drivers` | Duyệt / từ chối / khóa / mở tài xế |
| `/admin/refunds` | Duyệt hoặc từ chối yêu cầu hoàn cọc |
| `/admin/disputes` | Xem tranh chấp, bằng chứng hai bên; **yêu cầu bổ sung** (bên khiếu nại / bên bị khiếu nại / cả hai, hạn 24 giờ); duyệt hồ sơ từng bên; **chốt phán quyết** với số tiền và lý do — hệ thống sinh biên bản PDF |
| `/admin/withdrawals` | Duyệt (đã chuyển khoản) / từ chối lệnh rút tiền |
| `/admin/reviews` | Xem toàn bộ đánh giá, xóa đánh giá vi phạm |
| `/admin/config` | Sửa biểu phí và chính sách: tỷ lệ cọc, hoa hồng, rút tối thiểu, phí rút, phí trễ mỗi giờ, % hoàn cọc theo mốc, định mức km/ngày, các bậc phí vượt km, phí bảo hiểm và phí tài xế mỗi ngày, hotline, email hỗ trợ. Thay đổi áp dụng ngay cho đơn mới |

Trợ lý AI với vai trò Admin có thể trả lời các câu hỏi thống kê (doanh thu, tỉ lệ hủy, CSAT) bằng số liệu thật từ dashboard.

---

## Phần C — Giới hạn của phiên bản hiện tại
- Thanh toán MoMo chạy sandbox/giả lập; không có hoàn tiền tự động qua cổng.
- SMS là giả lập (console); không có email, không có thông báo đẩy thời gian thực (thông báo cập nhật 30 giây/lần).
- File lưu trên ổ đĩa máy chủ.
- Giấy tờ xe và giá có tài xế chưa có ô nhập trên giao diện (chỉ qua API); giá ngày lễ chưa được áp dụng khi tính tiền.
- Tài xế chỉ thao tác qua Magic Link cho từng chuyến.
