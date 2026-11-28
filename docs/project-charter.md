# Hiến chương Dự án (Project Charter) — Car Rental System

| Thuộc tính | Giá trị |
|---|---|
| Tên dự án | Car Rental System — Hệ thống cho thuê xe trực tuyến |
| Môn học | Quản lý Dự án Phần mềm (QLDAPM) |
| Nhóm | Nhóm 10 |
| Giảng viên hướng dẫn | Thầy Lý Tuấn Anh |
| Thời gian thực hiện (theo lịch sử git) | **02/10/2026 → 28/11/2026** (~8 tuần, 58 ngày lịch) |
| Kho mã nguồn | `CAR-RENTAL-SYSTEM---QLDAPM` (nhánh chính `main`) |
| Phiên bản tài liệu | 1.0 — cập nhật 28/11/2026 |

> Ghi chú về số liệu: mọi mốc thời gian trong tài liệu này lấy từ `git log --date=short` của kho mã (commit đầu 02/10/2026, commit cuối 28/11/2026, 148 commit gồm 128 commit thường và 20 commit merge Pull Request). Tài liệu không dùng các số liệu không có minh chứng trong repo (vận tốc Sprint, số lỗi, thời gian phản hồi…).

---

## 1. Bối cảnh

Thị trường cho thuê xe tự lái và xe có tài xế tại Việt Nam phần lớn vẫn vận hành thủ công: chủ xe nhận đặt qua điện thoại/mạng xã hội, giao nhận xe bằng giấy, tranh cãi về trầy xước, trả trễ, vượt km khó có căn cứ. Khách thuê khó so sánh giá và không có bằng chứng khi xảy ra tranh chấp; chủ xe khó quản lý nhiều xe và tài xế.

Dự án xây dựng một nền tảng trung gian (marketplace) giải quyết các điểm đau trên bằng: đặt xe trực tuyến có báo giá tự động, đặt cọc, biên bản giao nhận điện tử có chữ ký và ảnh, tự tính phụ phí theo quy tắc minh bạch, quy trình tranh chấp có hạn chót và phán xử, cùng trợ lý AI giải đáp chính sách.

Đồng thời đây là sản phẩm của môn QLDAPM, nên ngoài phần mềm, nhóm phải thể hiện được quy trình quản lý dự án: phạm vi, lịch trình, phân công, quản lý rủi ro, quản lý thay đổi và kiểm thử.

## 2. Mục tiêu (SMART)

| # | Mục tiêu | Tiêu chí đo | Hiện trạng thực tế (28/11/2026) |
|---|---|---|---|
| G1 | Xây dựng hệ thống 3 thành phần (backend, frontend, AI service) chạy được trên máy phát triển trước hạn nộp đồ án | Cả 3 dịch vụ khởi động được theo `docs/user-manual.md`; luồng đặt xe → cọc → duyệt → giao xe → trả xe → quyết toán → đánh giá chạy đầu-cuối | Đạt. Backend 28 controller / 173 phương thức REST, frontend 38 trang / 40 route, AI service FastAPI |
| G2 | Hiện thực các Use Case cốt lõi của 5 tác nhân (Khách, Chủ xe, Tài xế, Admin, AI) | ≥ 39 UC được đặc tả; mỗi UC có trạng thái kiểm chứng bằng code | 52 UC: 44 Hoàn thiện, 6 MVP, 2 Chỉ đặc tả (xem `docs/srs.md` mục 4) |
| G3 | Tự động hóa các quy tắc tiền bạc để giảm tranh cãi | Cọc 30%, hoàn cọc theo bậc, phí trễ giờ theo mốc, phí vượt km 3 bậc đều tính bằng code và cấu hình được | Đạt; có unit test cho phí trễ, phí km, giá cuối tuần, hoàn cọc |
| G4 | Quản lý lược đồ dữ liệu có phiên bản | Toàn bộ thay đổi CSDL qua Flyway | Đạt: 37 migration, 24 bảng (`docs/database-schema.sql`) |
| G5 | Có kiểm thử tự động cho nghiệp vụ quan trọng | Unit test JUnit chạy được bằng `mvnw test` | 82 lượt test backend ở mốc review (81 chạy không cần CSDL + 1 `contextLoads` cần PostgreSQL; 86 lượt khi tính thêm test blacklist JWT đang bổ sung), 2 test AI service; frontend chưa có test tự động, có 10 bộ đặc tả kiểm thử thủ công |
| G6 | Có trợ lý AI trả lời theo vai trò, dựa trên tài liệu nghiệp vụ của chính hệ thống | RAG trên bộ tài liệu nội bộ; nhận diện 4 vai trò từ JWT | Đạt: 13 tài liệu, Gemini 2.5 Flash, vai trò GUEST/CUSTOMER/OWNER/ADMIN |

## 3. Phạm vi

### 3.1 Trong phạm vi
1. Tài khoản: đăng ký, đăng nhập bằng số điện thoại, JWT, quên mật khẩu bằng OTP, hồ sơ, KYC 5 ảnh.
2. Xe: CRUD, ảnh, giá ngày thường/cuối tuần, chặn lịch, duyệt xe, nhập Excel; chỉ xe 4/5/7 chỗ.
3. Đặt xe: báo giá tự động, kiểm tra trùng lịch, thuê tự lái/có tài xế.
4. Thanh toán: cọc 30% và quyết toán phần còn lại qua MoMo **sandbox / giả lập**; hoàn cọc có Admin duyệt.
5. Giao nhận: biên bản PICKUP/RETURN điện tử, chữ ký trên màn hình, ảnh, phí trễ giờ, phí vượt km, phụ phí.
6. Tài xế: CRUD, nhập Excel, phân công qua Magic Link (SMS giả lập), hạn 3 giờ, tự gán lại tối đa 5 lượt.
7. Đánh giá: sao cho xe/chủ xe/tài xế, ẩn danh, hội thoại phản hồi khách ↔ chủ xe.
8. Tranh chấp: khiếu nại, phản tố 48h, bổ sung bằng chứng 24h, Admin phán xử, biên bản PDF.
9. Chủ xe: đăng ký làm chủ xe, dashboard doanh thu, rút tiền.
10. Quản trị: duyệt hồ sơ, cấu hình phí, dashboard, quản lý người dùng, kiểm duyệt đánh giá, quỹ cọc.
11. Thông báo trong ứng dụng (polling 30 giây).
12. AI Concierge: RAG + Gemini, tra cứu đơn/số liệu bằng JWT.

### 3.2 Ngoài phạm vi
1. Cổng thanh toán thật và hoàn tiền tự động qua cổng.
2. SMS thật, email, WebSocket / thông báo đẩy.
3. Lưu trữ đám mây (Cloudinary/S3) — hiện lưu đĩa server.
4. Xuất báo cáo Excel.
5. Ứng dụng di động; tài khoản web và màn hình thu nhập/báo sự cố cho tài xế.
6. Triển khai production (domain, HTTPS, CI/CD, giám sát).

## 4. Mốc tiến độ thực tế (theo lịch sử git)

| Mốc | Khoảng thời gian | Nội dung chính | Minh chứng trong repo |
|---|---|---|---|
| M0 — Khởi tạo & nền tảng | 02/10 – 03/10 | Docker Compose (PostgreSQL, Redis), Spring Boot, Flyway V1–V7; khung các module auth, car, booking, payment, review, driver, notification, admin, handover; khởi tạo frontend Vite + React, phân quyền `ProtectedRoute` | Commit đầu tiên 02/10; migration V1–V7 |
| M1 — Hiện thực nghiệp vụ chính | 04/10 – 09/10 | Thanh toán giả lập, chính sách hoàn cọc, phân công tài xế + Magic Link + SMS giả lập, thông báo, đánh giá, tranh chấp, KYC, biên bản giao nhận, rút tiền, cấu hình nền tảng, phí trễ giờ, phí vượt km 3 bậc, đăng ký chủ xe, thanh toán quyết toán, quên mật khẩu | Commit gắn mã UC (UC-C03, UC-C09, UC-O08, UC-AD03, UC-C12, UC-C13…); migration V12–V27 |
| M2 — AI & chuẩn hóa API | 10/10 | AI service (RAG + Gemini); chuẩn hóa toàn bộ module theo hợp đồng API; Swagger/OpenAPI; nạp `.env`; PR #1–#3 | `ai-service/`, `openapi.yaml`; merge PR #1–#3 |
| M3 — Ổn định CSDL & mở rộng quản trị | 11/10 – 17/10 | Migration V30–V35 đồng bộ entity; quản lý tài xế phía Admin; trang tranh chấp Admin; bắt đầu làm việc qua nhánh `feature/fix-bug*` và PR | PR #4–#7 |
| M4 — Độ tin cậy & kiểm thử | 24/10 – 01/11 | Hàng đợi trễ Redis cho tự hủy đơn (31/10); dashboard Admin; bộ unit test backend đầu tiên (31/10 – 01/11) | `BookingDelayedQueueService`; `backend/src/test`; PR #8–#13 |
| M5 — Hoàn thiện luồng đơn hàng | 14/11 – 20/11 | Hoàn thiện booking/handover/review/payment; hội thoại phản hồi đánh giá (V36, V37); rút tiền chủ xe | PR #14–#16 |
| M6 — Kiểm thử, tài liệu & review | 25/11 – 28/11 | 10 bộ đặc tả kiểm thử giao diện; tài liệu tham chiếu API cho frontend; trang chi tiết đơn; review đối chiếu báo cáo với code và sửa lỗi bảo mật/nghiệp vụ (đang ở working tree); viết các tài liệu `docs/*` | `docs/frontend-verification/`, `docs/api-contract.md`, `docs/bao-cao-review.md`; PR #17–#19 |

Nhận xét lịch trình:
- Khối lượng code lớn tập trung ở 02/10 – 12/10 (101 trên 128 commit thường nằm trong 02/10 – 12/10); tháng 11 có 17 commit thường.
- Có các khoảng không có commit: 13–15/10, 18–23/10, 02–13/11, 21–24/11.
- Dự án kéo dài ~8 tuần, **không phải 6 tuần** như kế hoạch ban đầu trong báo cáo cũ; nhiều tính năng lớn (hàng đợi Redis, unit test, hội thoại đánh giá, rút tiền, trang chi tiết đơn) được làm sau mốc giữa tháng 10. Đây là thay đổi lịch trình cần ghi nhận trong phần quản lý thay đổi.

## 5. Nhóm dự án và vai trò

| Thành viên | MSSV | Vai trò | Trách nhiệm chính |
|---|---|---|---|
| Nguyễn Lê Nhựt Hào | N23DCCN086 | Tech Lead | Kiến trúc tổng thể, nền tảng backend (bảo mật, Flyway, cấu trúc module), review và merge Pull Request, quản lý kho mã |
| Trần Quang Khoan | N23DCCN099 | Backend & AI | Nghiệp vụ backend (đặt xe, thanh toán, biên bản, tài xế, tranh chấp…), AI service (RAG, Gemini, tích hợp backend) |
| Đinh Việt Hoàng | N23DCCN089 | Frontend & Admin UI | Giao diện người dùng và các màn hình quản trị |
| Võ Văn Hoàng | N23DCCN090 | PO / BA / QA & viết tài liệu | Quản lý yêu cầu, đặc tả use case, kế hoạch và kịch bản kiểm thử, biên soạn báo cáo và tài liệu dự án |

Mức đóng góp thực tế của từng thành viên cần được đối chiếu với minh chứng (lịch sử commit, PR, biên bản họp/pair programming) trước khi đưa vào báo cáo — xem `docs/bao-cao-review.md` mục 6.3.

## 6. Các bên liên quan

| Bên liên quan | Vai trò / quan tâm | Mức ảnh hưởng |
|---|---|---|
| GVHD — Thầy Lý Tuấn Anh | Nhà tài trợ học thuật, đánh giá sản phẩm và quy trình quản lý dự án | Cao |
| Nhóm 10 (4 thành viên) | Thực hiện dự án | Cao |
| Khách thuê xe (người dùng giả định) | Đặt xe nhanh, giá minh bạch, được bảo vệ khi tranh chấp | Cao (định hướng yêu cầu) |
| Chủ xe đối tác (giả định) | Quản lý xe/tài xế, nhận đơn, bằng chứng giao nhận, rút doanh thu | Cao |
| Tài xế (giả định) | Nhận chuyến đơn giản, không phải cài ứng dụng | Trung bình |
| Quản trị viên sàn (giả định) | Kiểm soát chất lượng hồ sơ, xử lý tranh chấp, cấu hình phí | Cao |
| Nhà cung cấp dịch vụ ngoài: Google (Gemini API), MoMo (sandbox) | Phụ thuộc kỹ thuật | Trung bình |

## 7. Tóm tắt rủi ro

| # | Rủi ro | Khả năng | Ảnh hưởng | Biện pháp / tình trạng |
|---|---|---|---|---|
| R1 | Trễ tiến độ do phạm vi lớn so với thời gian môn học | Đã xảy ra | Cao | Lịch thực tế kéo dài ~8 tuần; ưu tiên UC lõi, các UC tài xế D04/D05 để ở mức đặc tả |
| R2 | Tài liệu/báo cáo lệch với code (số endpoint, công nghệ không có thật) | Đã xảy ra | Cao | Review đối chiếu (`docs/bao-cao-review.md`), viết lại tài liệu theo code |
| R3 | Lỗ hổng bảo mật ở luồng thanh toán và phân quyền | Đã xảy ra | Cao | Đã sửa trong đợt review: xác minh chữ ký MoMo, giới hạn `mock-success`, chỉ Admin được đánh dấu đã cọc/hoàn tiền thủ công, bảo vệ API phân công tài xế |
| R4 | Phụ thuộc dịch vụ ngoài (Gemini, MoMo) | Trung bình | Trung bình | MoMo chạy sandbox + giả lập; AI service lỗi không ảnh hưởng luồng đặt xe |
| R5 | Quy trình Git không đồng nhất (giai đoạn đầu commit thẳng lên `main`) | Đã xảy ra | Trung bình | Từ PR #4 chuyển sang làm việc qua nhánh + PR; ghi nhận làm bài học kinh nghiệm |
| R6 | Thiếu kiểm thử tự động cho frontend | Cao | Trung bình | Có 10 bộ đặc tả kiểm thử thủ công; cần thực thi và ghi kết quả UAT |
| R7 | Đăng xuất chưa thu hồi token | Đã xảy ra | Trung bình | Đã xử lý (28/11): blacklist bằng Redis (`TokenBlacklistService`) thu hồi cả access token và refresh token khi đăng xuất |
| R8 | Cấu hình môi trường không đồng bộ (mật khẩu DB giữa `docker-compose.yml` và `.env.example`, địa chỉ Magic Link, thư mục upload) | Đã xảy ra | Thấp | Đang xử lý trong working tree: đồng bộ mật khẩu `123456`, thêm biến `FRONTEND_URL`, `APP_UPLOAD_DIR` được đọc; ghi rõ trong hướng dẫn cài đặt |

## 8. Ràng buộc và giả định
- Thời gian: theo lịch môn học; nhóm 4 người làm song song với các môn khác.
- Ngân sách: không có ngân sách tiền mặt; chỉ dùng phần mềm mã nguồn mở, dịch vụ sandbox và khóa API cá nhân.
- Môi trường: chạy trên máy cá nhân (localhost), chưa triển khai production.
- Giả định: người dùng có trình duyệt hiện đại; tài xế nhận được Magic Link (trong demo, link được lấy từ console backend).

## 9. Tiêu chí nghiệm thu
1. Ba dịch vụ khởi động được theo hướng dẫn; Flyway tạo đủ 24 bảng và dữ liệu mẫu.
2. Luồng đầu-cuối đặt xe → quyết toán → đánh giá chạy được với tài khoản mẫu.
3. Các UC trạng thái "Hoàn thiện" trong `docs/srs.md` thao tác được trên giao diện.
4. `mvnw test` chạy qua các unit test không phụ thuộc CSDL.
5. Tài liệu `docs/*` có nội dung khớp với code.

## 10. Phê duyệt

| Vai trò | Họ tên | Chữ ký | Ngày |
|---|---|---|---|
| Giảng viên hướng dẫn | Thầy Lý Tuấn Anh | | |
| Tech Lead | Nguyễn Lê Nhựt Hào | | |
| Product Owner | Võ Văn Hoàng | | |
