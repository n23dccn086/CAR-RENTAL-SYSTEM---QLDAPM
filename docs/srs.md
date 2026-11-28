# Đặc tả Yêu cầu Phần mềm (SRS) — Car Rental System

| Thuộc tính | Giá trị |
|---|---|
| Dự án | Car Rental System — đồ án môn Quản lý Dự án Phần mềm (QLDAPM) |
| Nhóm | Nhóm 10 — GVHD: Thầy Lý Tuấn Anh |
| Phiên bản tài liệu | 1.0 (28/11/2026) |
| Cơ sở đối chiếu | Nhánh `main` tại commit `debc0f8` cộng các bản sửa trong working tree đợt review (xem `docs/bao-cao-review.md`) |
| Nguyên tắc | Mọi yêu cầu, con số và trạng thái trong tài liệu này được đối chiếu với **mã nguồn hiện tại**. Khi tài liệu cũ (báo cáo PDF, README trước đây) mâu thuẫn với code, tài liệu này theo code. |

---

## 1. Giới thiệu

### 1.1 Mục đích
Tài liệu mô tả các yêu cầu chức năng và phi chức năng của hệ thống cho thuê xe trực tuyến Car Rental System, dùng làm cơ sở cho: phát triển, kiểm thử (`docs/test-plan.md`), hướng dẫn sử dụng (`docs/user-manual.md`) và báo cáo đồ án.

### 1.2 Phạm vi sản phẩm
Car Rental System là nền tảng kết nối **khách thuê xe**, **chủ xe đối tác**, **tài xế của chủ xe** và **ban quản trị sàn**. Hệ thống hỗ trợ:

- Thuê xe **tự lái** và **có tài xế**; chỉ nhận xe **4, 5 hoặc 7 chỗ**.
- Đặt xe có báo giá tự động, đặt cọc 30%, chủ xe duyệt đơn, giao/nhận xe bằng **biên bản điện tử có chữ ký số**, tự tính **phí trả trễ** và **phí vượt km**, thanh toán quyết toán phần còn lại.
- Hủy đơn và hoàn cọc theo bậc thời gian; khiếu nại/tranh chấp sau chuyến có quy trình phản tố và phán xử của Admin.
- Đánh giá sau chuyến (xe, chủ xe, tài xế) và hội thoại phản hồi giữa khách và chủ xe.
- Quản trị: duyệt xe, KYC, hồ sơ chủ xe, tài xế; cấu hình biểu phí; dashboard doanh thu; duyệt rút tiền.
- Trợ lý **AI Concierge** (RAG + Gemini) tư vấn chính sách và tra cứu dữ liệu theo vai trò.

### 1.3 Định nghĩa, từ viết tắt

| Thuật ngữ | Ý nghĩa |
|---|---|
| KYC | Xác minh danh tính: nộp 5 ảnh GPLX mặt trước/sau, CCCD mặt trước/sau, ảnh chân dung (selfie) |
| Magic Link | Đường dẫn có token gửi tài xế để xem và nhận/từ chối chuyến, không cần tài khoản |
| Biên bản PICKUP / RETURN | Biên bản giao xe cho khách / nhận lại xe từ khách |
| Cọc (DEPOSIT) | Khoản thanh toán đầu tiên = tổng giá × `default_deposit_percent` |
| Quyết toán (REMAINING) | Khoản còn lại sau khi trả xe = tổng giá (đã cộng phụ phí) − cọc |
| RAG | Retrieval-Augmented Generation — truy xuất tài liệu nghiệp vụ trước khi gọi LLM |
| Config | Tham số nền tảng lưu trong bảng `platform_config`, Admin chỉnh được |

### 1.4 Tài liệu liên quan
- `docs/database-schema.sql`, `docs/erd.puml` — lược đồ CSDL 24 bảng.
- `docs/use-case-diagram.puml` — sơ đồ use case.
- `docs/api-contract.md`, `openapi.yaml` — đặc tả API (lưu ý: `openapi.yaml` mô tả chi tiết 89 operation chính; danh mục đầy đủ 174 phương thức xử lý ở `docs/api-endpoints.md`, sinh bằng `node scripts/gen-api-endpoints.js`).
- `docs/frontend-verification/*.md` — 10 bộ kịch bản kiểm thử giao diện.
- `ai-service/data/documents/*.md` — 13 tài liệu tri thức của AI.

---

## 2. Mô tả tổng quan

### 2.1 Kiến trúc

| Thành phần | Công nghệ | Ghi chú |
|---|---|---|
| Backend | Java 21, Spring Boot 4.0.8, Spring Security + JWT (JJWT), Spring Data JPA, Flyway, MapStruct, Lombok | 28 controller, **174** phương thức xử lý REST (`docs/api-endpoints.md`); context path `/api/v1`; Swagger UI qua springdoc |
| CSDL | PostgreSQL 15 | 37 migration (V1–V37), **24 bảng** |
| Redis | Redis 7 | (1) Hàng đợi trễ (Sorted Set) cho tự hủy đơn đã cọc mà chủ xe chưa duyệt; (2) blacklist JWT khi đăng xuất (`TokenBlacklistService`, lưu SHA-256 của token với TTL bằng thời gian sống còn lại; Redis lỗi thì fail-open). Cấu hình nền tảng **không** cache bằng Redis mà cache trong bộ nhớ 60 giây |
| Thư viện | Apache POI, Apache PDFBox | Nhập xe/tài xế từ Excel; xuất biên bản phán xử tranh chấp PDF |
| Lưu trữ file | Ổ đĩa server, thư mục `uploads` | Phục vụ qua `/api/v1/files/**` |
| Frontend | React 19, Vite 8, React Router 7, Zustand, Axios | **38** trang, **40** route |
| AI service | Python, FastAPI, ChromaDB, sentence-transformers, Google Gemini | Model `gemini-2.5-flash`; embedding `paraphrase-multilingual-MiniLM-L12-v2`; 13 tài liệu RAG |

### 2.2 Tác nhân

| Tác nhân | Mô tả | Cách truy cập |
|---|---|---|
| **Khách vãng lai (Guest)** | Chưa đăng nhập. Xem/tìm xe, xem đánh giá, đăng ký, đăng nhập, quên mật khẩu, chat với AI (vai trò GUEST) | Web, không cần JWT |
| **Khách hàng (Customer)** | Tài khoản `CUSTOMER`. Kế thừa Guest; KYC, đặt xe, thanh toán, ký biên bản, đánh giá, hủy đơn, tranh chấp, nộp hồ sơ làm chủ xe | Web + JWT |
| **Chủ xe (Owner)** | Tài khoản `OWNER` (được nâng quyền sau khi Admin duyệt hồ sơ). Quản lý xe, tài xế, duyệt đơn, lập biên bản, doanh thu, rút tiền | Web + JWT |
| **Tài xế (Driver)** | Thuộc một chủ xe, lưu ở bảng `drivers`. **Không có tài khoản web**; nhận Magic Link qua SMS (giả lập — in ra console backend) để xem và nhận/từ chối chuyến | Link `/driver/assignment/:id?token=...` |
| **Quản trị viên (Admin)** | Tài khoản `ADMIN`. Duyệt hồ sơ, giải quyết tranh chấp/hoàn cọc, cấu hình phí, dashboard, quản lý người dùng | Web + JWT |
| **AI Concierge** | Tác nhân hệ thống (FastAPI). Giải mã vai trò từ JWT, truy xuất RAG, gọi API backend bằng chính JWT của người dùng | Widget chat trên mọi trang |
| **Bộ lập lịch (Scheduler)** | Tác nhân hệ thống: các tác vụ `@Scheduled` + hàng đợi Redis (tự hủy đơn, hết hạn phân công, hạn tranh chấp) | Nội bộ backend |
| **Cổng thanh toán MoMo** | Tác nhân ngoài, chạy **sandbox**; luồng demo dùng `POST /payments/{id}/mock-success` | — |

### 2.3 Vòng đời đơn thuê

```
PENDING ──(thanh toán cọc)──► PAID ──(chủ xe duyệt)──► APPROVED ──(ký đủ biên bản PICKUP)──► RENTED
   │                            │                         │                                    │
   │ quá 12h chưa cọc           │ quá 4h chưa duyệt       │                                    │ ký đủ biên bản RETURN
   ▼                            ▼ (hoàn 100% cọc)         ▼                                    ▼
CANCELLED ◄──── khách hủy / chủ xe từ chối ─────────── CANCELLED                       RETURNED ──(thanh toán quyết toán)──► COMPLETED
```

---

## 3. Yêu cầu chức năng (theo phân hệ)

Mã yêu cầu dạng `FR-<phân hệ>-<số>`; cột "UC" tham chiếu mục 4.

### 3.1 Xác thực & tài khoản (`AuthController`, `UserController`, `VerificationController`)

| Mã | Yêu cầu | UC |
|---|---|---|
| FR-AUTH-01 | Đăng ký bằng họ tên (2–100 ký tự), số điện thoại (10–11 chữ số, duy nhất), email (tùy chọn, duy nhất), mật khẩu 8–100 ký tự; vai trò mặc định `CUSTOMER`; trả HTTP 201 kèm JWT | C01 |
| FR-AUTH-02 | Đăng nhập bằng **số điện thoại + mật khẩu**; trả access token (1 giờ) và refresh token (7 ngày); tài khoản bị khóa không đăng nhập được | C02 |
| FR-AUTH-03 | Làm mới token (`/auth/refresh`); đăng xuất (`/auth/logout`) — access token bị đưa vào blacklist Redis tới khi hết hạn, mọi request dùng lại token đó bị từ chối | C02 |
| FR-AUTH-04 | Quên mật khẩu: gửi OTP 6 số qua SMS (giả lập), OTP hết hạn sau 5 phút, sai tối đa 5 lần, gửi lại sau 60 giây; đặt lại mật khẩu bằng OTP | C14 |
| FR-AUTH-05 | Xem/cập nhật hồ sơ (`/auth/me`, `/users/me`), đổi mật khẩu khi đã đăng nhập | C15 |
| FR-KYC-01 | Khách tải lên 5 ảnh KYC (GPLX trước/sau, CCCD trước/sau, selfie) rồi gửi duyệt → trạng thái `PENDING` | C03 |
| FR-KYC-02 | Khách chưa `VERIFIED` **không được đặt xe tự lái**; thuê có tài xế không bắt buộc KYC | C03, C06 |

### 3.2 Xe (`CarController`, `OwnerCarController`)

| Mã | Yêu cầu | UC |
|---|---|---|
| FR-CAR-01 | Danh sách/tìm kiếm xe công khai (`/cars`, `/cars/search`, `/cars/available`), xem chi tiết, ảnh, đánh giá của xe | C04, C05 |
| FR-CAR-02 | Chủ xe thêm/sửa/xóa xe; xe mới ở trạng thái `PENDING` chờ Admin duyệt; số chỗ chỉ nhận **4, 5, 7**; năm sản xuất 1990–2100; giá không âm | O02 |
| FR-CAR-03 | Chủ xe tải ảnh xe, đổi trạng thái xe (`PATCH /owner/cars/{id}/status`) | O02 |
| FR-CAR-04 | Chủ xe tải giấy tờ xe (đăng ký, đăng kiểm, bảo hiểm) — **chỉ có API**, chưa có màn hình | O03 |
| FR-CAR-05 | Chủ xe cấu hình giá (ngày thường, cuối tuần, lễ, có tài xế, phí giao xe, phí vệ sinh…) và chặn lịch xe (`POST /cars/{id}/blocked-dates`). Giao diện tạo/sửa xe có ô giá ngày thường và giá cuối tuần; trang sửa xe có mục thêm/gỡ lịch chặn (`POST`/`DELETE /cars/{id}/blocked-dates`); các trường giá khác (lễ, có tài xế, phí giao xe…) chỉ qua API `PUT /cars/{id}/pricing` | O04 |
| FR-CAR-06 | Nhập xe hàng loạt từ Excel **11 cột**: Biển số, Hãng, Model, Năm, Số chỗ, Loại xe, Hộp số, Nhiên liệu, Giá/ngày, Địa chỉ, Mô tả; dòng lỗi được báo riêng, xe nhập ở trạng thái `PENDING` | O11 |
| FR-CAR-07 | Admin duyệt / từ chối xe (`PUT /cars/{id}/approve|reject`) | AD01 |

### 3.3 Đặt xe (`BookingController`, `PricingService`)

| Mã | Yêu cầu | UC |
|---|---|---|
| FR-BK-01 | Tạo đơn: kiểm tra KYC (tự lái), xe `AVAILABLE` hoặc `RENTED`, chủ xe không tự thuê xe mình, ngày trả sau ngày nhận, **không trùng đơn đang hiệu lực**, **không trùng lịch chủ xe đã chặn** (kiểm tra ở server) | C06 |
| FR-BK-02 | Báo giá tự động: số ngày = làm tròn lên theo khối 24h (tối thiểu 1); tiền thuê cộng **giá từng ngày** (T7/CN dùng giá cuối tuần nếu có); cộng phí giao xe, bảo hiểm `insurance_fee_per_day` (100.000đ/ngày, nếu chọn), phí tài xế `driver_fee_per_day` (500.000đ/ngày, nếu thuê có tài xế); cọc = 30% tổng | C06 |
| FR-BK-03 | Thuê có tài xế: hệ thống chỉ nhận đơn khi chủ xe còn tài xế `ACTIVE/BUSY` rảnh lịch; khách có thể chọn tài xế hoặc để hệ thống chọn ngẫu nhiên tài xế rảnh | C06 |
| FR-BK-04 | Khách xem danh sách và chi tiết đơn của mình; chủ xe xem đơn của các xe mình | C08, O05 |
| FR-BK-05 | Chủ xe duyệt đơn `PAID` → `APPROVED` (hủy job tự hủy trong Redis; nếu có tài xế thì tạo phân công Magic Link) hoặc từ chối → `CANCELLED` + hoàn 100% cọc | O05 |
| FR-BK-06 | Khách hủy đơn ở `PENDING/PAID/APPROVED`; tạo yêu cầu hoàn cọc theo bậc (BR-04); có thể gửi lại yêu cầu hoàn cọc cho đơn đã hủy (`/bookings/{id}/re-request-refund`) | C11 |
| FR-BK-07 | Tự hủy đơn `PENDING` quá 12 giờ chưa cọc; tự hủy đơn `PAID` quá 4 giờ kể từ lúc cọc mà chủ xe chưa duyệt (hoàn 100% cọc) | C11 |

### 3.4 Thanh toán & hoàn tiền (`PaymentController`, `AdminRefundController`)

| Mã | Yêu cầu | UC |
|---|---|---|
| FR-PAY-01 | Tạo thanh toán `DEPOSIT` khi đơn `PENDING`, `REMAINING` khi đơn `RETURNED`; **server tự tính số tiền** từ đơn, từ chối nếu client gửi sai | C07, C16 |
| FR-PAY-02 | Callback MoMo xác minh chữ ký HMAC-SHA256; với credential DEMO, callback bị từ chối và luồng demo đi qua `POST /payments/{id}/mock-success` (chỉ chủ payment hoặc Admin) | C07, C16 |
| FR-PAY-03 | Cọc thành công: đơn → `PAID`, đưa vào hàng đợi tự hủy 4h, thông báo chủ xe. Quyết toán thành công: đơn → `COMPLETED` | C07, C16 |
| FR-PAY-04 | Yêu cầu hoàn tiền (`refunds`) ở trạng thái `PENDING`; Admin duyệt (`SUCCESS`) hoặc từ chối (`CANCELLED`). Hoàn tiền thủ công `POST /payments/{id}/refund` và đánh dấu đã cọc `PUT /bookings/{id}/paid` chỉ dành cho Admin | AD02 |

### 3.5 Giao nhận xe (`HandoverController`, `HandoverServiceImpl`)

| Mã | Yêu cầu | UC |
|---|---|---|
| FR-HO-01 | Chủ xe (hoặc Admin) lập biên bản PICKUP khi đơn `APPROVED`, RETURN khi đơn `RENTED`; mỗi đơn tối đa 1 biên bản mỗi loại; ghi ODO, mức nhiên liệu, ghi chú ngoại/nội thất, hư hỏng, ảnh, phụ phí phát sinh | O06 |
| FR-HO-02 | Đơn có tài xế: chỉ lập được biên bản khi tài xế đã **nhận chuyến** | O06, D03 |
| FR-HO-03 | Hai bên ký trên màn hình; khi đủ 2 chữ ký → `SIGNED`, lưu `record_hash`. PICKUP đủ ký → đơn `RENTED`, xe `RENTED`. RETURN đủ ký → đơn `RETURNED`, cộng phí trễ + phí vượt km + phụ phí vào tổng, cập nhật số còn lại | C09, O06 |
| FR-HO-04 | Tính phí trả trễ theo BR-06 | C12 |
| FR-HO-05 | Tính phí vượt km theo BR-07; ODO trả nhỏ hơn ODO nhận → báo lỗi; vượt quá giới hạn km/ngày hoặc tổng → báo lỗi chống nhập nhầm | C13 |

### 3.6 Tài xế (`DriverController`, `OwnerDriverController`, `DriverAssignmentController`)

| Mã | Yêu cầu | UC |
|---|---|---|
| FR-DRV-01 | Chủ xe thêm/sửa/xóa/đổi trạng thái tài xế, tải ảnh đại diện; tài xế mới `PENDING` chờ Admin duyệt | O09 |
| FR-DRV-02 | Nhập tài xế từ Excel **10 cột**: Tên, SĐT, Email, CCCD, Số GPLX, Hạng GPLX, Ngày hết hạn GPLX, Ngày sinh, Địa chỉ, Số năm kinh nghiệm | O12 |
| FR-DRV-03 | Phân công: tạo lượt `driver_assignments` có token, hạn phản hồi **3 giờ**, gửi Magic Link qua SMS giả lập; quá hạn → `EXPIRED` và tự gán tài xế rảnh kế tiếp; tối đa **5 lượt**/đơn | O10 |
| FR-DRV-04 | Tài xế mở Magic Link xem thông tin chuyến, nhận hoặc từ chối (kèm lý do) | D01, D02, D03 |

### 3.7 Đánh giá (`ReviewController`)

| Mã | Yêu cầu | UC |
|---|---|---|
| FR-RV-01 | Chỉ đánh giá được đơn `COMPLETED` của chính mình, mỗi đơn 1 lần; chấm sao 1–5 cho xe và chủ xe (bắt buộc), tài xế (tùy chọn); bình luận, ảnh, tùy chọn **ẩn danh** | C10 |
| FR-RV-02 | Chủ xe phản hồi đánh giá; khách trả lời lại sau khi chủ xe đã phản hồi; hội thoại nhiều lượt (`review_replies`) | O13, C18 |
| FR-RV-03 | Admin xem tất cả và xóa đánh giá vi phạm; khách xóa được đánh giá của mình | AD07 |

### 3.8 Tranh chấp (`DisputeController`, `AdminDisputeController`)

| Mã | Yêu cầu | UC |
|---|---|---|
| FR-DS-01 | Khách hoặc chủ xe của một đơn **COMPLETED** tạo tranh chấp (danh mục: hư hỏng xe, trả muộn, vượt km, không nhận xe, thanh toán, thái độ, khác), kèm mô tả, số tiền yêu cầu, ảnh bằng chứng | C17, O14 |
| FR-DS-02 | Bên bị khiếu nại trong **48 giờ**: chấp nhận (`ACCEPTED`) hoặc phản tố kèm bằng chứng (`COUNTER_FILED`); quá hạn hệ thống tự chuyển `ACCEPTED` | C17, O14 |
| FR-DS-03 | Admin yêu cầu bổ sung bằng chứng từ một hoặc cả hai bên (`WAITING_EVIDENCE`, hạn **24 giờ**); quá hạn tự trở về `PENDING` | AD02 |
| FR-DS-04 | Admin duyệt hồ sơ của bên khiếu nại và bên bị khiếu nại (`APPROVED_RAISER` / `APPROVED_AGAINST`, đủ cả hai → `READY_TO_FINALIZE`), sau đó chốt phán quyết (`RESOLVED`) với số tiền và lý do; sinh biên bản PDF | AD02 |

### 3.9 Thông báo (`NotificationController`)

| Mã | Yêu cầu | UC |
|---|---|---|
| FR-NT-01 | Hệ thống tạo thông báo trong ứng dụng cho các sự kiện đơn, thanh toán, hoàn tiền, xe, tài xế, biên bản, đánh giá, tranh chấp, rút tiền, KYC, hồ sơ chủ xe | C19 |
| FR-NT-02 | Người dùng xem danh sách, số chưa đọc, đánh dấu đã đọc/đọc tất cả, xóa một/nhiều/tất cả; giao diện tự cập nhật số chưa đọc **30 giây/lần** (polling) | C19 |

### 3.10 Chủ xe — đăng ký, doanh thu, rút tiền

| Mã | Yêu cầu | UC |
|---|---|---|
| FR-OW-01 | Khách nộp hồ sơ chủ xe (thông tin cá nhân, CCCD, tài khoản ngân hàng) + ảnh giấy tờ (bắt buộc CCCD 2 mặt và GPKD hoặc GPLX 2 mặt); Admin duyệt → vai trò thành `OWNER` | O01, AD09 |
| FR-OW-02 | Dashboard doanh thu: thu nhập = Σ tổng giá đơn `COMPLETED` × (100% − hoa hồng 15%); số dư khả dụng = thu nhập − các lệnh rút đang chờ/đã chuyển | O07 |
| FR-OW-03 | Tạo lệnh rút tiền ≥ `min_withdrawal` (100.000đ), không vượt số dư, cần ít nhất 1 đơn hoàn thành; phí rút `withdrawal_fee` (0đ) được chụp lại ở lệnh | O08 |

### 3.11 Quản trị

| Mã | Yêu cầu | UC |
|---|---|---|
| FR-AD-01 | Duyệt/từ chối KYC người dùng (`/admin/users/{id}/verify|reject-verification`) và xe | AD01 |
| FR-AD-02 | Xem, sửa, thêm cấu hình nền tảng; xóa cache cấu hình ngay khi cập nhật | AD03 |
| FR-AD-03 | Dashboard: doanh thu sàn, thực nhận nền tảng, tỉ lệ hủy, CSAT, số hồ sơ chờ duyệt | AD04 |
| FR-AD-04 | Duyệt (→ `COMPLETED`) hoặc từ chối (→ `REJECTED`) lệnh rút tiền | AD05 |
| FR-AD-05 | Quản lý người dùng: danh sách, thống kê, khóa/mở, xóa, xem hồ sơ xác minh | AD06 |
| FR-AD-06 | Theo dõi quỹ cọc tạm giữ (`/admin/dashboard/deposits`) | AD08 |
| FR-AD-07 | Duyệt/từ chối hồ sơ chủ xe | AD09 |
| FR-AD-08 | Duyệt/từ chối/khóa/mở tài xế | AD10 |

### 3.12 AI Concierge (`ai-service`)

| Mã | Yêu cầu | UC |
|---|---|---|
| FR-AI-01 | `POST /ai/chat`: nhận tin nhắn + JWT (tùy chọn), xác định vai trò GUEST/CUSTOMER/OWNER/ADMIN, nhận diện ý định bằng từ khóa, trả lời bằng Gemini kèm gợi ý câu hỏi theo vai trò | AI01–AI04 |
| FR-AI-02 | Truy xuất RAG từ ChromaDB (13 tài liệu, tự đánh chỉ mục khi khởi động; `POST /ai/rag/reindex`, `GET /ai/rag/stats`) | AI02 |
| FR-AI-03 | Tra cứu dữ liệu thật bằng JWT của người dùng: đơn của khách (`/bookings/my`), đơn của chủ xe (`/bookings/owner`), số liệu Admin (`/admin/dashboard/stats`) | AI03 |
| FR-AI-04 | Gợi ý xe: lấy danh sách xe công khai (`/cars`, 10 xe đầu) đưa vào ngữ cảnh | AI01 |

---

## 4. Danh sách Use Case

Trạng thái:
- **Hoàn thiện** — có backend + giao diện, chạy được đầu-cuối (có thể dùng dịch vụ giả lập như SMS console).
- **MVP** — chạy được nhưng thiếu phần quan trọng (cổng thanh toán thật, giao diện, lọc dữ liệu…).
- **Chỉ đặc tả** — chưa có code.

Mã C01–AD05 giữ nguyên theo báo cáo cũ (39 UC); các UC bổ sung từ C14, O13, AD06 trở đi là chức năng có trong code nhưng báo cáo cũ chưa liệt kê.

### 4.1 Khách hàng / Khách vãng lai

| ID | Tên | Tác nhân | Trạng thái | Bằng chứng |
|---|---|---|---|---|
| UC-C01 | Đăng ký tài khoản | Khách vãng lai | Hoàn thiện | `POST /auth/register`; `RegisterPage.jsx` |
| UC-C02 | Đăng nhập / đăng xuất | Khách, Chủ xe, Admin | Hoàn thiện | `POST /auth/login`, `/auth/refresh`, `/auth/logout`; `LoginPage.jsx` |
| UC-C03 | Xác thực KYC | Khách hàng | Hoàn thiện | `/verification/upload`, `/verification/submit`, `/users/documents/{gplx,cccd,selfie}`; `VerificationPage.jsx` |
| UC-C04 | Tìm kiếm xe | Khách vãng lai, Khách hàng | Hoàn thiện | `GET /cars`, `/cars/search`, `/cars/available`; `SearchPage.jsx` |
| UC-C05 | Xem chi tiết xe | Khách vãng lai, Khách hàng | Hoàn thiện | `GET /cars/{id}`, `/cars/{id}/reviews`, `/cars/{id}/images`; `CarDetailPage.jsx` |
| UC-C06 | Đặt xe & báo giá | Khách hàng | Hoàn thiện | `POST /bookings`; `PricingService`; `BookingPage.jsx` |
| UC-C07 | Thanh toán cọc | Khách hàng, MoMo | MVP | `POST /payments`, `POST /payments/{id}/mock-success`; `MomoGateway` (sandbox); `PaymentPage.jsx` |
| UC-C08 | Quản lý đơn thuê | Khách hàng | Hoàn thiện | `GET /bookings/my`, `/bookings/{id}`; `MyBookingsPage.jsx`, `BookingDetailPage.jsx` |
| UC-C09 | Ký biên bản bàn giao số | Khách hàng | Hoàn thiện | `GET /handovers/booking/{id}`, `POST /handovers/{id}/sign`; `HandoverPage.jsx`, `SignatureCanvas.jsx` |
| UC-C10 | Đánh giá sau chuyến (CSAT) | Khách hàng | Hoàn thiện | `POST /reviews`; `ReviewPage.jsx` |
| UC-C11 | Hủy đơn & hoàn cọc | Khách hàng, Scheduler | Hoàn thiện | `PUT /bookings/{id}/status` (CANCELLED), `POST /bookings/{id}/re-request-refund`; `BookingScheduler`, `BookingDelayedQueueService` |
| UC-C12 | Tính phí vượt giờ | Hệ thống (khi lập biên bản RETURN) | Hoàn thiện | `HandoverServiceImpl.calculateLateFee`; `HandoverLateFeeTest` |
| UC-C13 | Tính phí vượt km | Hệ thống (khi lập biên bản RETURN) | Hoàn thiện | `HandoverServiceImpl.calculateKmOverage`; `HandoverKmOverageTest` |
| UC-C14 | Quên mật khẩu bằng OTP | Người dùng (Khách/Chủ xe/Admin) | Hoàn thiện (SMS giả lập) | `POST /auth/forgot-password`, `/auth/reset-password`; `OtpServiceImpl`; `ForgotPasswordPage.jsx`, `ResetPasswordPage.jsx` |
| UC-C15 | Cập nhật hồ sơ & đổi mật khẩu | Người dùng đã đăng nhập | Hoàn thiện | `GET/PUT /auth/me`, `/users/me`, `POST /auth/change-password`; `ProfilePage.jsx` |
| UC-C16 | Thanh toán quyết toán phần còn lại | Khách hàng, MoMo | MVP | `POST /payments` (`paymentType=REMAINING`) + `mock-success`; `PaymentFinalPage.jsx` |
| UC-C17 | Khiếu nại / phản tố tranh chấp (phía khách) | Khách hàng | Hoàn thiện | `POST /disputes`, `PUT /disputes/{id}/accept|counter-evidence|submit-review|submit-evidence`, `GET /disputes/my|against-me`; `DisputesPage.jsx` |
| UC-C18 | Trả lời phản hồi đánh giá | Khách hàng | Hoàn thiện | `POST /reviews/{id}/customer-reply`, `/reviews/{id}/replies`; `ReviewThread.jsx` (route `/my-reviews/:reviewId`) |
| UC-C19 | Trung tâm thông báo | Khách hàng, Chủ xe, Admin | Hoàn thiện | `NotificationController` (7 endpoint); `NotificationsPage.jsx`; polling 30s ở `WheelNav.jsx` |

### 4.2 Chủ xe

| ID | Tên | Tác nhân | Trạng thái | Bằng chứng |
|---|---|---|---|---|
| UC-O01 | Đăng ký làm chủ xe | Khách hàng | Hoàn thiện | `POST /owner-register/submit`, `/owner-register/{id}/upload`, `GET /owner-register/my`; `OwnerRegisterPage.jsx` |
| UC-O02 | Quản lý xe (CRUD) | Chủ xe | Hoàn thiện | `POST/PUT/DELETE /cars`, `GET /cars/my`, `GET /owner/cars`, `PATCH /owner/cars/{id}/status`, `/cars/{id}/images`; `CreateCarPage.jsx`, `CarEditPage.jsx`, `OwnerCarsPage.jsx` |
| UC-O03 | Upload giấy tờ xe | Chủ xe | MVP | `POST /cars/{id}/documents` — chỉ có API, frontend không gọi; cột `verified` luôn FALSE |
| UC-O04 | Cấu hình giá & chặn lịch | Chủ xe | Hoàn thiện | CreateCarPage/CarEditPage có ô **giá ngày thường** và **giá cuối tuần** (gửi qua `POST/PUT /cars`); CarEditPage có mục thêm/gỡ lịch chặn (`POST`/`DELETE /cars/{id}/blocked-dates`), CarDetailPage hiển thị “Lịch đã kín” cho khách; server chặn đặt trùng lịch. Giá có tài xế, phí giao xe… vẫn chỉ qua API `PUT /cars/{id}/pricing`. `price_holiday`, `deposit_percent`, `base_km_per_day` theo xe chưa được dùng khi tính giá |
| UC-O05 | Duyệt / từ chối đơn | Chủ xe | Hoàn thiện | `PUT /bookings/{id}/status` (APPROVED / CANCELLED); `OwnerBookingsPage.jsx` |
| UC-O06 | Lập & cập nhật biên bản bàn giao | Chủ xe | Hoàn thiện | `POST /handovers/pickup`, `/handovers/return`, `/handovers/{id}/sign`, `/handovers/upload-image`; `HandoverFormModal.jsx` |
| UC-O07 | Bảng điều khiển doanh thu | Chủ xe | Hoàn thiện | `GET /owner/withdrawals/balance`, `GET /bookings/owner`; `OwnerDashboard.jsx` |
| UC-O08 | Yêu cầu rút tiền | Chủ xe | Hoàn thiện | `POST /owner/withdrawals`, `GET /owner/withdrawals/my`; `OwnerWithdrawalsPage.jsx` |
| UC-O09 | Quản lý tài xế (CRUD) | Chủ xe | Hoàn thiện | `POST /drivers`, `GET /drivers/my`, `PUT/PATCH/DELETE /drivers/{id}`, `/owner/drivers/upload-avatar`; `OwnerDriversPage.jsx` |
| UC-O10 | Phân công tài xế qua Magic Link | Chủ xe, Scheduler | Hoàn thiện (SMS giả lập) | `DriverAssignmentServiceImpl.assignSelectedDriver/assignNextDriver`, `POST /drivers/assign`, `POST /driver/assignments/booking/{id}/auto-assign`; `AssignmentScheduler`; `MockNotificationSender` |
| UC-O11 | Import xe từ Excel | Chủ xe | Hoàn thiện | `POST /owner/cars/import` (11 cột); `ExcelImportService.importCars`; `OwnerCarsPage.jsx` |
| UC-O12 | Import tài xế từ Excel | Chủ xe | Hoàn thiện | `POST /owner/drivers/import` (10 cột); `ExcelImportService`; `OwnerDriversPage.jsx` |
| UC-O13 | Phản hồi đánh giá | Chủ xe | Hoàn thiện | `POST /reviews/{id}/reply`, `/reviews/{id}/replies`; `OwnerReviewsPage.jsx` |
| UC-O14 | Khiếu nại / phản tố tranh chấp (phía chủ xe) | Chủ xe | Hoàn thiện | Cùng endpoint `/disputes/**` như UC-C17; `DisputesPage.jsx`; `CounterEvidenceServiceImpl` |

### 4.3 Tài xế

| ID | Tên | Tác nhân | Trạng thái | Bằng chứng |
|---|---|---|---|---|
| UC-D01 | Truy cập bằng Magic Link | Tài xế | Hoàn thiện (SMS giả lập) | `GET /driver/assignments/{id}?token=`; route `/driver/assignment/:id`; `DriverAssignmentPage.jsx` |
| UC-D02 | Xem lịch chạy | Tài xế | MVP | Chỉ xem chi tiết **một** chuyến qua link; không có danh sách lịch chạy |
| UC-D03 | Nhận / từ chối chuyến | Tài xế | Hoàn thiện | `POST /driver/assignments/{id}/accept|reject?token=`; hạn 3h, tối đa 5 lượt; biên bản bị chặn khi tài xế chưa nhận (`HandoverDriverAcceptedTest`) |
| UC-D04 | Báo sự cố | Tài xế | Chỉ đặc tả | Không có endpoint / màn hình |
| UC-D05 | Xem thu nhập | Tài xế | Chỉ đặc tả | Không có endpoint / màn hình |

### 4.4 Trợ lý AI

| ID | Tên | Tác nhân | Trạng thái | Bằng chứng |
|---|---|---|---|---|
| UC-AI01 | Gợi ý xe | Khách vãng lai, Khách hàng, AI | MVP | Ý định `search_car` → `GET /cars` không lọc tham số, lấy 10 xe đầu (`backend_client.search_cars`, `llm_service.generate_reply`) |
| UC-AI02 | Tư vấn thủ tục (RAG) | Mọi vai trò, AI | Hoàn thiện | `rag_service.py` (ChromaDB, 13 tài liệu), `SOURCE_FILTER_MAP` trong `chat.py` |
| UC-AI03 | Tra cứu đơn / số liệu realtime qua JWT | Khách hàng, Chủ xe, Admin, AI | Hoàn thiện | `get_my_bookings`, `get_owner_bookings`, `get_admin_stats` trong `backend_client.py` |
| UC-AI04 | Hướng dẫn xử lý sự cố khẩn cấp | Khách hàng, AI | MVP | Ý định `emergency` (từ khóa "sự cố", "tai nạn"…) → trả lời bằng RAG; không có chuyển tiếp tổng đài/tạo phiếu |

### 4.5 Quản trị viên

| ID | Tên | Tác nhân | Trạng thái | Bằng chứng |
|---|---|---|---|---|
| UC-AD01 | Duyệt xe & KYC | Admin | Hoàn thiện | `PUT /cars/{id}/approve|reject`, `PUT /admin/users/{id}/verify|reject-verification`; `AdminApprovalsPage.jsx`, `AdminUsersPage.jsx` |
| UC-AD02 | Giải quyết tranh chấp & hoàn cọc | Admin, Scheduler | Hoàn thiện | `/admin/disputes/{id}/approve-raiser|approve-against|request-evidence|resolve|finalize`, `/admin/refunds/{id}/approve|reject`; `DisputeDeadlineScheduler`, `DisputeContractServiceImpl` (PDFBox); `AdminDisputesPage.jsx`, `AdminRefundsPage.jsx` |
| UC-AD03 | Cấu hình biểu phí | Admin | Hoàn thiện | `GET /admin/config`, `PUT /admin/config/{key}`, `POST /admin/config`; `AdminConfigPage.jsx`; `ConfigHelper` (cache 60s, xóa khi cập nhật) |
| UC-AD04 | Dashboard doanh thu | Admin | Hoàn thiện | `GET /admin/dashboard/stats`; `AdminDashboard.jsx` |
| UC-AD05 | Duyệt rút tiền | Admin | Hoàn thiện | `PUT /admin/withdrawals/{id}/approve|reject`; `AdminWithdrawalsPage.jsx` |
| UC-AD06 | Quản lý người dùng | Admin | Hoàn thiện | `GET /admin/users`, `/admin/users/stats`, `PUT /admin/users/{id}/lock|unlock`, `DELETE /admin/users/{id}`; `AdminUsersPage.jsx` |
| UC-AD07 | Kiểm duyệt đánh giá | Admin | Hoàn thiện | `GET /reviews/all`, `DELETE /reviews/{id}`; `AdminReviewsPage.jsx` |
| UC-AD08 | Theo dõi quỹ cọc tạm giữ | Admin | Hoàn thiện | `GET /admin/dashboard/deposits`; `AdminDashboard.jsx` |
| UC-AD09 | Duyệt hồ sơ chủ xe | Admin | Hoàn thiện | `/admin/owner-requests` (list, pending-count, detail, approve, reject); `AdminOwnerRequestsPage.jsx` |
| UC-AD10 | Duyệt & khóa tài xế | Admin | Hoàn thiện | `/admin/drivers/{id}/approve|reject|lock|unlock`, `PATCH /admin/drivers/{id}/status`; `AdminDriversPage.jsx` |

### 4.6 Thống kê

| Nhóm | Hoàn thiện | MVP | Chỉ đặc tả | Tổng |
|---|---|---|---|---|
| 39 UC gốc (C01–C13, O01–O12, D01–D05, AI01–AI04, AD01–AD05) | 32 | 5 (C07, O03, D02, AI01, AI04) | 2 (D04, D05) | 39 |
| 13 UC bổ sung (C14–C19, O13–O14, AD06–AD10) | 12 | 1 (C16) | 0 | 13 |
| **Tổng** | **44** | **6** | **2** | **52** |

So với báo cáo cũ: UC-D03 chuyển từ MVP lên Hoàn thiện (luồng nhận/từ chối, hạn 3h, tự gán lại đã chạy đầy đủ); UC-AI01 chuyển từ Hoàn thiện xuống MVP (chưa lọc xe theo nhu cầu); UC-O04 chuyển từ MVP lên Hoàn thiện sau khi bổ sung giao diện giá cuối tuần và lịch chặn (28/11).

### 4.7 Đặc tả chi tiết một số UC trọng yếu

**UC-C06 — Đặt xe & báo giá**
- Tiền điều kiện: đã đăng nhập; thuê tự lái thì tài khoản `VERIFIED`.
- Luồng chính: (1) khách chọn xe, ngày giờ nhận/trả, hình thức thuê, địa chỉ, bảo hiểm, giao xe; (2) frontend xem trước giá (khớp thuật toán backend); (3) gửi `POST /bookings`; (4) hệ thống kiểm tra FR-BK-01, tính giá FR-BK-02, tạo đơn `PENDING`; (5) chuyển sang trang thanh toán cọc.
- Luồng thay thế: trùng lịch đơn khác hoặc lịch chủ xe chặn → `BOOKING_ALREADY_EXISTS`; không còn tài xế rảnh → báo lỗi gợi ý đổi thời gian hoặc thuê tự lái.
- Hậu điều kiện: đơn giữ lịch xe tối đa 12 giờ chờ cọc.

**UC-C11 — Hủy đơn & hoàn cọc**
- Khách hủy ở `PENDING` → không phát sinh hoàn tiền. Ở `PAID/APPROVED` → tạo `refunds` `PENDING` theo BR-04, thông báo Admin duyệt.
- Đơn có tài xế mà mọi tài xế đều bận → hoàn 100% cọc.
- Hệ thống tự hủy theo BR-02, BR-03.

**UC-O06 + UC-C09 + UC-C12/C13 — Giao nhận xe**
- PICKUP: chủ xe lập biên bản (ODO, nhiên liệu, ảnh, ghi chú, chữ ký) → khách ký → đơn `RENTED`.
- RETURN: chủ xe lập biên bản, hệ thống tính phí trễ và phí vượt km, cộng phụ phí → khách ký → đơn `RETURNED`, số tiền còn lại được cập nhật → khách thanh toán quyết toán (UC-C16) → `COMPLETED`.

**UC-C17 / UC-O14 / UC-AD02 — Tranh chấp**
- Bên khiếu nại tạo tranh chấp (`PENDING`, hạn phản tố 48h) → bên bị khiếu nại chấp nhận (`ACCEPTED`) hoặc phản tố (`COUNTER_FILED`) → Admin có thể yêu cầu bổ sung (`WAITING_EVIDENCE`, 24h; nộp xong trở về `PENDING`) → Admin duyệt hồ sơ/bằng chứng của từng bên (`approve-raiser` → `APPROVED_RAISER`, `approve-against` → `APPROVED_AGAINST`; khi cả hai bên đã được duyệt → `READY_TO_FINALIZE`) → Admin chốt phán quyết với số tiền và lý do (`resolve`/`finalize`) → `RESOLVED`, sinh PDF. Trạng thái `CLOSED` được kiểm tra như trạng thái kết thúc nhưng hiện không có luồng nào gán.

---

## 5. Quy tắc nghiệp vụ (số liệu lấy từ code / config hiện tại)

| Mã | Quy tắc | Nguồn |
|---|---|---|
| BR-01 | **Cọc** = tổng giá × `default_deposit_percent` = **30%** (làm tròn HALF_UP); còn lại = tổng − cọc | `PricingService.calculateDeposit`, V6 |
| BR-02 | Đơn `PENDING` chưa cọc quá **12 giờ** kể từ lúc tạo → tự hủy (quét 5 phút/lần), thông báo khách và chủ xe | `BookingScheduler.PENDING_TIMEOUT_HOURS` |
| BR-03 | Đơn `PAID` chủ xe chưa duyệt quá **4 giờ kể từ lúc cọc** → tự hủy + hoàn **100%** cọc. Job đặt vào Redis Sorted Set khi cọc thành công, quét mỗi phút; khi khởi động lại server đối soát Redis với CSDL; Redis lỗi thì quét trực tiếp CSDL | `BookingScheduler`, `BookingDelayedQueueService`, `PaymentServiceImpl` |
| BR-04 | **Hoàn cọc khi khách hủy** (tính theo thời gian còn lại tới giờ nhận xe): ≥ 24h → **100%**; 4–24h → **70%**; < 4h → **50%**; sau giờ nhận → **0%**. Chủ xe từ chối → **100%** (bắt buộc, V22 xóa config tương ứng). Yêu cầu hoàn tiền chờ Admin duyệt | `BookingServiceImpl.calculateRefundAmount`, V19, V22 |
| BR-05 | **Giá thuê**: số ngày = ⌈giờ/24⌉, tối thiểu 1; tiền thuê = Σ đơn giá từng ngày (ngày rơi vào **T7/CN** dùng `price_weekend` nếu > 0); bảo hiểm `insurance_fee_per_day` = **100.000đ/ngày** (nếu chọn); phí tài xế `driver_fee_per_day` = **500.000đ/ngày** (thuê có tài xế); phí giao xe theo xe (nếu chọn giao) | `PricingService`, `ConfigHelper`, V38 |
| BR-06 | **Phí trả trễ** (so với giờ trả dự kiến): < 15 phút miễn phí; 15–60 phút = `default_late_fee_per_hour` (**100.000đ**); 1–4 giờ = **½ đơn giá ngày**; 4–24 giờ = **1 đơn giá ngày**; mỗi **24 giờ trọn** = **120% đơn giá ngày**, phần lẻ tính lại theo bảng trên. Đơn giá ngày lấy theo ngày nhận xe (giá cuối tuần nếu nhận T7/CN) | `HandoverServiceImpl.calculateLateFee` |
| BR-07 | **Phí vượt km**: định mức `default_km_per_day` = **300 km/ngày** × số ngày (mọi loại xe). Km vượt: 50 km đầu × **5.000đ**; 50 km tiếp theo × **8.000đ**; phần trên 100 km × **12.000đ**/km. Giới hạn chống nhập nhầm: km vượt ≤ min(`max_total_km_overage` = 2.000, `max_km_overage_per_day` = 500 × số ngày) — hai giá trị này là mặc định trong code, chưa được seed vào CSDL. Ví dụ: thuê 1 ngày, chạy 400 km → vượt 100 km → 50×5.000 + 50×8.000 = **650.000đ** | `HandoverServiceImpl.calculateKmOverage`, `ConfigHelper`, V23 |
| BR-08 | Xe chỉ **4, 5 hoặc 7 chỗ** (API, form và import Excel) | `CarRequest`, `ExcelImportService` |
| BR-09 | Không đặt được xe trùng đơn đang hiệu lực (mọi trạng thái trừ `CANCELLED`, `COMPLETED`) hoặc trùng lịch chủ xe chặn | `BookingRepository.existsActiveBooking`, `CarBlockedDateRepository` |
| BR-10 | **Phân công tài xế**: hạn phản hồi **3 giờ**; tối đa **5 lượt**/đơn; quá hạn tự gán tài xế rảnh kế tiếp (quét mỗi phút) | `DriverAssignmentServiceImpl`, `AssignmentScheduler` |
| BR-11 | **Tranh chấp**: chỉ cho đơn `COMPLETED`; 9 trạng thái `PENDING`, `COUNTER_FILED`, `WAITING_EVIDENCE`, `READY_TO_FINALIZE`, `APPROVED_RAISER`, `APPROVED_AGAINST`, `ACCEPTED`, `RESOLVED`, `CLOSED`; hạn phản tố **48 giờ** (quá hạn → `ACCEPTED`); hạn bổ sung bằng chứng **24 giờ** (quá hạn → `PENDING`); quét 5 phút/lần | `DisputeServiceImpl`, `AdminDisputeServiceImpl`, `DisputeDeadlineScheduler` |
| BR-12 | **Đánh giá**: chỉ đơn `COMPLETED`, 1 đánh giá/đơn, sao 1–5; khách chỉ trả lời sau khi chủ xe đã phản hồi | `ReviewServiceImpl` |
| BR-13 | **Hoa hồng nền tảng** `commission_rate` = **15%** → chủ xe nhận 85% tổng giá đơn hoàn thành. Rút tối thiểu **100.000đ**, phí rút **0đ** | `ConfigHelper`, `OwnerWithdrawalServiceImpl`, V6 |
| BR-14 | **OTP**: 6 số, hết hạn 5 phút, tối đa 5 lần sai, gửi lại sau 60 giây | `OtpServiceImpl` |
| BR-15 | **KYC**: 5 ảnh `GPLX_FRONT`, `GPLX_BACK`, `CCCD_FRONT`, `CCCD_BACK`, `SELFIE`; bắt buộc để thuê tự lái | `VerificationServiceImpl`, `BookingServiceImpl` |
| BR-16 | **Excel**: xe 11 cột; tài xế 10 cột; bản ghi nhập vào ở trạng thái `PENDING` | `ExcelImportService` |
| BR-17 | **File tải lên**: ảnh JPEG/PNG/WEBP/GIF tối đa 5 MB (kiểm tra cả nội dung, chống giả đuôi); PDF/Word tối đa 20 MB; request tối đa 100 MB | `FileStorageService`, `application.yml` |
| BR-18 | **Cấu hình** được cache trong bộ nhớ **60 giây**, xóa cache ngay khi Admin sửa | `ConfigHelper` |

Ghi chú: `V38__add_fee_configs.sql` thêm config `insurance_fee_per_day` = 100000 và `driver_fee_per_day` = 500000; `PricingService` đọc hai khóa này qua `ConfigHelper` (mặc định 100.000 / 500.000 nếu chưa có dòng config), nên Admin chỉnh được BR-05.

---

## 6. Yêu cầu phi chức năng

| Mã | Nhóm | Yêu cầu | Hiện trạng trong code |
|---|---|---|---|
| NFR-01 | Bảo mật | Xác thực stateless bằng JWT (access 1 giờ, refresh 7 ngày); mật khẩu băm BCrypt | Có (`JwtService`, `SecurityConfig`) |
| NFR-02 | Bảo mật | Phân quyền theo vai trò ở server (`@PreAuthorize`, `/admin/**` chỉ ADMIN) và ở client (`ProtectedRoute`) | Có |
| NFR-03 | Bảo mật | Số tiền thanh toán do server tính; callback MoMo xác minh HMAC-SHA256; `mock-success` chỉ chủ payment/Admin | Có (sửa trong đợt review) |
| NFR-04 | Bảo mật | Magic Link dùng token ngẫu nhiên (UUID bỏ dấu gạch, 32 ký tự hex; cột chứa tối đa 64), có hạn 3 giờ; API phân công cho chủ xe không trả token | Có |
| NFR-05 | Bảo mật | Thu hồi token khi đăng xuất | Có (bổ sung trong đợt review): blacklist JWT bằng Redis, kiểm tra ở `JwtAuthFilter`; fail-open khi Redis lỗi (đánh đổi có chủ đích cho demo). Khi đăng xuất, frontend gửi kèm refresh token để thu hồi cả hai token; `/auth/refresh` từ chối refresh token đã thu hồi |
| NFR-06 | Toàn vẹn dữ liệu | Biên bản đã ký lưu `record_hash`; không trùng biên bản cùng loại cho một đơn (UNIQUE) | Có |
| NFR-07 | Độ tin cậy | Tự hủy đơn quá hạn không mất job khi server khởi động lại (đối soát Redis–CSDL), có fallback khi Redis lỗi | Có |
| NFR-08 | Khả năng cấu hình | Tham số phí/chính sách lưu trong `platform_config`, áp dụng ngay sau khi Admin sửa | Có |
| NFR-09 | Khả dụng giao diện | Tiếng Việt; hộp thoại xác nhận thay cho `alert` trình duyệt (`DialogContext`); chữ ký trên màn hình cảm ứng/chuột | Có |
| NFR-10 | Tài liệu API | Swagger UI tại `/api/v1/swagger-ui.html` (springdoc) | Có; `openapi.yaml` thủ công đang lệch với code |
| NFR-11 | Khả năng bảo trì | Lược đồ CSDL quản lý bằng Flyway (V1–V37), migration idempotent (`IF NOT EXISTS`) | Có |
| NFR-12 | Kiểm thử | Unit test JUnit 5 + Mockito cho nghiệp vụ tính tiền, hủy/hoàn, biên bản, thanh toán, đánh giá, blacklist JWT | 86 lượt test backend tại thời điểm viết (82 ở mốc review + 4 test blacklist mới), xem `docs/test-plan.md` |
| NFR-13 | Hiệu năng | — | Chưa có số đo; tài liệu này **không** cam kết thời gian phản hồi cụ thể |

---

## 7. Ràng buộc, giả định và ngoài phạm vi

### 7.1 Ràng buộc
- Chạy môi trường phát triển: frontend `localhost:5173`, backend `localhost:8080/api/v1`, AI `localhost:8000`. Địa chỉ frontend dùng để dựng Magic Link cấu hình bằng `FRONTEND_URL` (mặc định `http://localhost:5173`); danh sách CORS vẫn khai báo `localhost:5173`.
- File lưu trên ổ đĩa server, thư mục cấu hình bằng `APP_UPLOAD_DIR` (mặc định `uploads`).
- Cần PostgreSQL 15 và Redis 7 (có sẵn `docker-compose.yml`, mật khẩu PostgreSQL `123456` khớp `backend/.env.example`). Redis là bắt buộc cho hàng đợi tự hủy và blacklist JWT, nhưng cả hai đều có cơ chế dự phòng khi Redis lỗi.
- AI service cần `GEMINI_API_KEY`; vai trò được đọc từ payload JWT (không kiểm chữ ký ở AI service, backend vẫn kiểm khi AI gọi API); lịch sử chat lưu trong bộ nhớ tiến trình.
- SMS (OTP, Magic Link) chỉ có `MockNotificationSender` in ra console ở mọi profile; tích hợp nhà mạng thật cần thêm một bean `NotificationSender` khác.

### 7.2 Ngoài phạm vi (phiên bản hiện tại)
1. Cổng thanh toán thật (MoMo production, VNPay, ZaloPay) và hoàn tiền tự động qua cổng — hiện MoMo sandbox + giả lập.
2. SMS thật, email, thông báo đẩy thời gian thực (WebSocket) — hiện thông báo in-app polling 30 giây, SMS in ra console.
3. Lưu trữ đám mây (Cloudinary/S3) — hiện lưu đĩa server.
4. Xuất báo cáo Excel — chỉ có nhập.
5. Ứng dụng di động; tài khoản web cho tài xế; báo sự cố và xem thu nhập của tài xế (UC-D04, UC-D05).
6. Giá ngày lễ, % cọc và định mức km riêng theo từng xe (đã có cột nhưng chưa dùng khi tính tiền).
7. Xe ngoài nhóm 4/5/7 chỗ.
