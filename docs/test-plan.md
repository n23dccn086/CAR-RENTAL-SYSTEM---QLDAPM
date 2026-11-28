# Kế hoạch Kiểm thử (Test Plan) — Car Rental System

| Thuộc tính | Giá trị |
|---|---|
| Dự án | Car Rental System — Nhóm 10, môn QLDAPM |
| Phụ trách QA | Võ Văn Hoàng (PO/BA/QA) |
| Phiên bản tài liệu | 1.0 (28/11/2026) |
| Tài liệu liên quan | `docs/srs.md` (UC, BR), `docs/frontend-verification/*.md`, `docs/bao-cao-review.md` |

> Nguyên tắc: tài liệu chỉ ghi kết quả đã có minh chứng trong repo. Các kịch bản thủ công/UAT chưa được thực thi được ghi là **"Chưa thực thi"**, không ghi "Pass".

---

## 1. Mục tiêu
1. Xác nhận các Use Case trạng thái "Hoàn thiện" và "MVP" trong `docs/srs.md` hoạt động đúng.
2. Xác nhận các quy tắc tiền bạc (cọc, hoàn cọc, giá cuối tuần, phí trễ giờ, phí vượt km) tính đúng theo BR-01 … BR-07.
3. Xác nhận phân quyền và các bản sửa bảo mật trong đợt review (thanh toán, phân công tài xế).
4. Cung cấp tiêu chí rõ ràng để quyết định sẵn sàng demo/nộp đồ án.

## 2. Phạm vi

### 2.1 Trong phạm vi
- Backend REST API (`/api/v1/**`): xác thực, xe, đặt xe, thanh toán, hoàn tiền, biên bản, tài xế & Magic Link, đánh giá, tranh chấp, thông báo, chủ xe, quản trị.
- Frontend 38 trang / 40 route (kiểm thử thủ công theo `docs/frontend-verification`).
- AI service: `/health`, `/ai/chat` theo 4 vai trò, RAG.
- Tác vụ nền: tự hủy đơn 12h/4h (Redis + DB), hết hạn phân công 3h, hạn tranh chấp 48h/24h.

### 2.2 Ngoài phạm vi
- Kiểm thử hiệu năng/tải, kiểm thử bảo mật xâm nhập chuyên sâu (không có công cụ và số đo trong repo).
- Cổng thanh toán thật, SMS thật, email (không có trong hệ thống).
- Trình duyệt di động native, ứng dụng di động.

## 3. Chiến lược kiểm thử

| Mức | Mục đích | Công cụ | Người thực hiện | Hiện trạng |
|---|---|---|---|---|
| **Unit test** | Kiểm tra logic nghiệp vụ trong service, cô lập phụ thuộc bằng mock | JUnit 5, Mockito (`spring-boot-starter-test`), pytest + FastAPI TestClient | Dev backend / AI | 86 lượt test backend (82 ở mốc review), 2 test AI (mục 7) |
| **API test** | Kiểm tra hợp đồng API, mã lỗi, phân quyền, luồng trạng thái qua HTTP thật | Swagger UI (`/api/v1/swagger-ui.html`), Postman hoặc curl | QA + Dev | Thủ công; repo **chưa có** Postman collection — cần bổ sung nếu muốn làm minh chứng |
| **Kiểm thử giao diện / UAT** | Kiểm tra màn hình theo vai trò và luồng đầu-cuối từ góc nhìn người dùng | Trình duyệt; 10 bộ đặc tả `docs/frontend-verification` | QA + PO, có thể mời người dùng thử | Đã đặc tả 480 kịch bản; **chưa ghi nhận lần thực thi nào** (mỗi file đều ghi "Executed scenarios: 0") |
| **Kiểm thử hồi quy** | Chạy lại unit test sau mỗi thay đổi lớn | `mvnw test` | Dev | Thực hiện thủ công trước khi merge; chưa có CI |

Kỹ thuật thiết kế ca kiểm thử: phân vùng tương đương và giá trị biên (mốc 15'/60'/4h/24h của phí trễ; mốc 50/100 km của phí km; mốc 4h/24h của hoàn cọc), bảng quyết định (trạng thái đơn × hành động), kiểm thử chuyển trạng thái (vòng đời đơn, tranh chấp, phân công tài xế).

## 4. Môi trường kiểm thử

| Thành phần | Cấu hình |
|---|---|
| CSDL | PostgreSQL 15 (Docker, `docker-compose.yml`), Flyway V1–V37 tự chạy |
| Hàng đợi | Redis 7 (Docker) |
| Backend | Java 21, Spring Boot 4.0.8, `http://localhost:8080/api/v1`, file `.env` từ `backend/.env.example` |
| Frontend | Node.js + Vite, `http://localhost:5173` |
| AI service | Python 3.11+, `http://localhost:8000`, cần `GEMINI_API_KEY` |
| Thanh toán | MoMo credential `DEMO` → dùng `POST /payments/{id}/mock-success` |
| SMS (OTP, Magic Link) | `MockNotificationSender` — đọc nội dung trong console backend |

Dữ liệu kiểm thử (seed Flyway, mật khẩu chung `Admin@123`):

| Vai trò | Số điện thoại | Email |
|---|---|---|
| Admin | 0900000001 | admin@carrental.com |
| Chủ xe | 0900000002 | owner@carrental.com |
| Khách hàng (đã KYC) | 0900000003 | customer@carrental.com |

Kèm 14 xe `AVAILABLE` (V26) và 3 tài xế `ACTIVE` (V32) thuộc chủ xe mẫu. Các mốc thời gian (12h, 4h, 3h, 48h, 24h) khi kiểm thử thủ công cần chỉnh trực tiếp cột thời gian trong CSDL (ví dụ lùi `created_at` của đơn) thay vì chờ thật.

## 5. Tiêu chí bắt đầu / kết thúc

### 5.1 Tiêu chí bắt đầu (Entry)
- Backend biên dịch được, Flyway chạy hết V1–V37 không lỗi.
- PostgreSQL và Redis đang chạy; 3 tài khoản mẫu đăng nhập được.
- Frontend `npm run build` thành công.
- Tính năng cần kiểm thử đã merge vào nhánh kiểm thử và có UC tương ứng trong `docs/srs.md`.

### 5.2 Tiêu chí kết thúc (Exit)
- 100% unit test backend không phụ thuộc CSDL (85 lượt tại thời điểm viết) pass; `contextLoads` pass khi có PostgreSQL.
- 2 test AI service pass (cần môi trường Python và phụ thuộc trong `requirements.txt`).
- Toàn bộ ca kiểm thử mức ưu tiên Cao ở mục 6 đã thực thi, không còn lỗi nghiêm trọng (chặn luồng chính hoặc sai tiền) chưa xử lý.
- Kết quả thực thi được ghi lại (cột "Kết quả" mục 6 và bảng "Execution summary" trong từng file `docs/frontend-verification`).

### 5.3 Tiêu chí tạm dừng
- Môi trường (CSDL/Redis) không khởi động được, hoặc lỗi chặn đăng nhập/đặt xe khiến > 50% ca còn lại không thực thi được.

## 6. Danh sách ca kiểm thử (API / UAT)

Mã `TC-xx` dùng thống nhất cho báo cáo. Cột "Tự động" ghi tên unit test đã bao phủ logic (nếu có). Kết quả mong đợi được tính theo code hiện tại.

| Mã | UC / BR | Mô tả | Bước chính | Kết quả mong đợi | Ưu tiên | Tự động | Kết quả |
|---|---|---|---|---|---|---|---|
| TC-01 | C01 | Đăng ký hợp lệ | `POST /auth/register` với SĐT mới, mật khẩu ≥ 8 ký tự | HTTP 201, trả access + refresh token, vai trò CUSTOMER | Cao | — | Chưa thực thi |
| TC-02 | C01 | Đăng ký trùng SĐT | Đăng ký lại SĐT đã có | Lỗi `PHONE_EXISTED` | TB | `AuthServiceTest.testRegisterDuplicatePhone` | Chưa thực thi |
| TC-03 | C02 | Đăng nhập sai mật khẩu | `POST /auth/login` sai mật khẩu | HTTP 401 `INVALID_CREDENTIALS` | Cao | `AuthServiceTest.testLoginWithWrongPassword` | Chưa thực thi |
| TC-03b | C02 / NFR-05 | Token bị thu hồi sau đăng xuất | Đăng nhập, gọi `/auth/logout`, dùng lại access token cũ gọi `/auth/me` | Bị từ chối (401) | Cao | `TokenBlacklistServiceTest` (4) | Chưa thực thi |
| TC-04 | C02, AD06 | Đăng nhập tài khoản bị khóa | Admin khóa user → user đăng nhập | Bị từ chối (`ACCOUNT_DISABLED`) | TB | `AuthServiceTest.testLoginWithLockedAccount` | Chưa thực thi |
| TC-05 | C14 / BR-14 | Quên mật khẩu bằng OTP | Gửi OTP, lấy mã trong console, đặt lại mật khẩu; thử nhập sai 5 lần và OTP quá 5 phút | Đúng OTP → đổi được mật khẩu; sai 5 lần hoặc quá hạn → bị từ chối | TB | — | Chưa thực thi |
| TC-06 | C03, AD01 / BR-15 | Nộp KYC và duyệt | Khách mới tải 5 ảnh, gửi duyệt; Admin duyệt | Khách `PENDING` → `VERIFIED`, nhận thông báo | Cao | — | Chưa thực thi |
| TC-07 | C06 / FR-KYC-02 | Đặt xe tự lái khi chưa KYC | Khách chưa xác thực đặt xe `SELF_DRIVE` | Lỗi "cần xác thực GPLX/CCCD" | Cao | `BookingServiceTest.testCreateBookingWithoutKyc` | Chưa thực thi |
| TC-08 | C06 / BR-09 | Đặt xe trùng lịch đơn khác | Đặt 2 đơn chồng thời gian cùng xe | Đơn thứ 2 lỗi `BOOKING_ALREADY_EXISTS` | Cao | — | Chưa thực thi |
| TC-09 | C06, O04 / BR-09 | Đặt xe vào ngày chủ xe chặn | Chủ xe thêm lịch chặn ở trang sửa xe, khách đặt xe trùng ngày | Lỗi "Chủ xe đã chặn lịch…" | Cao | `BookingServiceTest.testCreateBookingOnBlockedDates` | Chưa thực thi |
| TC-10 | C06 | Ngày trả không sau ngày nhận | `endDate ≤ startDate` | Lỗi `INVALID_BOOKING_DATES` | TB | `BookingServiceTest.testCreateBookingWithInvalidDates` | Chưa thực thi |
| TC-11 | C06 / BR-05, BR-01 | Báo giá có ngày cuối tuần | Xe giá thường 1.000.000đ, cuối tuần 1.200.000đ; thuê T6 10:00 → T2 10:00, tự lái, không bảo hiểm, không giao xe | 3 ngày (T6, T7, CN) = 1.000.000 + 1.200.000 + 1.200.000 = **3.400.000đ**; cọc 30% = **1.020.000đ** | Cao | `PricingServiceTest.testRentalFeePerDayWeekendPricing`, `testCalculateDeposit` | Chưa thực thi |
| TC-12 | C07 | Thanh toán cọc (giả lập) | `POST /payments` (DEPOSIT) → `POST /payments/{id}/mock-success` | Payment `SUCCESS`, đơn `PENDING` → `PAID`, chủ xe nhận thông báo "Có đơn đặt xe mới", job tự hủy 4h được đưa vào Redis | Cao | — | Chưa thực thi |
| TC-13 | C07, C16 / NFR-03 | Gửi sai số tiền | Gửi `amount` khác số tiền của đơn | Bị từ chối; server dùng số tiền của đơn | Cao | `PaymentAmountTest` (2) | Chưa thực thi |
| TC-14 | C07 / NFR-03 | Callback MoMo giả mạo | POST callback chữ ký sai / thiếu chữ ký / credential DEMO | Bị từ chối | Cao | `MomoGatewaySignatureTest` (4) | Chưa thực thi |
| TC-15 | C07 / NFR-03 | `mock-success` cho payment của người khác | User B gọi `mock-success` payment của user A | Bị từ chối (chỉ chủ payment hoặc Admin) | Cao | — | Chưa thực thi |
| TC-16 | O05 | Chủ xe duyệt đơn | Đơn `PAID`, chủ xe duyệt | Đơn `APPROVED`, job Redis bị gỡ, khách nhận thông báo; đơn có tài xế → tạo phân công Magic Link | Cao | — | Chưa thực thi |
| TC-17 | O05 / BR-04 | Chủ xe từ chối đơn đã cọc | Đơn `PAID`, chủ xe từ chối | Đơn `CANCELLED`, tạo refund 100% cọc `PENDING`, Admin nhận thông báo | Cao | `BookingRefundNotificationTest.ownerRejectPaid_adminGetsRefundRequested` | Chưa thực thi |
| TC-18 | C11 / BR-04 | Khách hủy theo bậc thời gian | Hủy đơn `PAID` khi còn ≥ 24h / 10h / 2h tới giờ nhận | Hoàn lần lượt **100% / 70% / 50%** cọc, refund `PENDING` chờ Admin | Cao | `BookingRefundNotificationTest` (9) | Chưa thực thi |
| TC-19 | C11 | Hủy đơn đã kết thúc | Hủy đơn `COMPLETED` / `CANCELLED` / `RENTED` | Lỗi `BOOKING_CANNOT_CANCEL`, không sinh refund | TB | `BookingServiceTest.testCancelCompletedBooking`, `testCancelCancelledBooking`, `BookingCancelNoDriverTest` (4) | Chưa thực thi |
| TC-20 | C11 / BR-02 | Tự hủy đơn chưa cọc | Lùi `created_at` của đơn `PENDING` quá 12h, chờ ≤ 5 phút | Đơn `CANCELLED`, khách và chủ xe nhận thông báo | TB | — | Chưa thực thi |
| TC-21 | C11 / BR-03 | Tự hủy đơn chủ xe không duyệt | Đơn `PAID` quá 4h kể từ lúc cọc | Đơn `CANCELLED`, refund 100% cọc; khởi động lại backend vẫn xử lý | Cao | `BookingServiceTest.testAutoCancelUnapprovedBooking` | Chưa thực thi |
| TC-22 | O06 / FR-HO-01, FR-HO-02 | Điều kiện lập biên bản | Lập PICKUP khi đơn chưa `APPROVED`; đơn có tài xế chưa nhận chuyến | Bị từ chối với thông báo tương ứng | Cao | `HandoverDriverAcceptedTest` (14), `HandoverServiceTest` (5) | Chưa thực thi |
| TC-23 | O06, C09 | Ký đủ biên bản giao xe | Chủ xe lập PICKUP + ký, khách ký | Biên bản `SIGNED`, đơn `RENTED`, xe `RENTED` | Cao | — | Chưa thực thi |
| TC-24 | C13 / BR-07 | Phí vượt km | Thuê 1 ngày, ODO nhận 10.000, ODO trả 10.400 | Định mức 300 km, vượt 100 km → 50×5.000 + 50×8.000 = **650.000đ** | Cao | `HandoverKmOverageTest` (6) | Chưa thực thi |
| TC-25 | C13 / BR-07 | ODO trả nhỏ hơn ODO nhận / vượt giới hạn | ODO trả < ODO nhận; hoặc km vượt > 500 km/ngày | Báo lỗi, không lưu biên bản | TB | `HandoverKmOverageTest.returnKmLessThanPickup`, `overCap` | Chưa thực thi |
| TC-26 | C12 / BR-06 | Phí trả trễ theo mốc | Đơn giá ngày 700.000đ; trả trễ 10' / 30' / 2h / 5h / 24h07' | **0đ / 100.000đ / 350.000đ / 700.000đ / 840.000đ** | Cao | `HandoverLateFeeTest` (7) | Chưa thực thi |
| TC-27 | C12 / BR-06 | Trả trễ nhiều ngày | Đơn giá 700.000đ, trễ 5 ngày tròn | 5 × 840.000 = **4.200.000đ** | TB | `HandoverLateFeeTest.multiDayLateFeeScales` | Chưa thực thi |
| TC-28 | O06, C09, C16 | Trả xe và quyết toán | Lập RETURN có phụ phí, hai bên ký, khách thanh toán REMAINING | Đơn `RETURNED`, tổng tiền cộng phụ phí, số còn lại cập nhật; sau thanh toán → `COMPLETED` | Cao | — | Chưa thực thi |
| TC-29 | C10 / BR-12 | Điều kiện đánh giá | Đánh giá đơn chưa `COMPLETED`; đánh giá lần 2 | Lỗi `BOOKING_STATUS_INVALID`; lỗi `REVIEW_ALREADY_EXISTS` | TB | — | Chưa thực thi |
| TC-30 | O13, C18 / BR-12 | Hội thoại phản hồi đánh giá | Khách trả lời trước khi chủ xe phản hồi; người ngoài trả lời | Bị chặn; sau khi chủ xe phản hồi, khách trả lời được | TB | `ReviewCustomerReplyTest` (3), `ReviewThreadReplyTest` (6) | Chưa thực thi |
| TC-31 | C17, O14, AD02 / BR-11 | Luồng tranh chấp | Tạo tranh chấp cho đơn `COMPLETED`; bên kia phản tố; Admin yêu cầu bổ sung; Admin duyệt hai bên và chốt | `PENDING` → `COUNTER_FILED` → `WAITING_EVIDENCE` → `PENDING` → `APPROVED_RAISER` → `READY_TO_FINALIZE` → `RESOLVED`, có PDF | Cao | — | Chưa thực thi |
| TC-32 | C17 / BR-11 | Hạn phản tố 48h | Tạo tranh chấp, lùi `counter_deadline_at` | Sau ≤ 5 phút tự chuyển `ACCEPTED` | TB | — | Chưa thực thi |
| TC-33 | O10, D01, D03 / BR-10 | Magic Link và hết hạn | Duyệt đơn có tài xế, lấy link trong console, tài xế nhận; lặp lại với tài xế không phản hồi (lùi `deadline_at`) | Nhận → `ACCEPTED`; quá hạn → `EXPIRED` và tạo lượt mới cho tài xế khác; dừng sau 5 lượt | Cao | — | Chưa thực thi |
| TC-34 | O11 / BR-08, BR-16 | Import xe Excel | File 11 cột có 1 dòng số chỗ = 9 | Các dòng hợp lệ được nhập (`PENDING`), dòng lỗi được báo "chỉ nhận 4, 5 hoặc 7 chỗ" | TB | — | Chưa thực thi |
| TC-35 | O12 / BR-16 | Import tài xế Excel | File 10 cột hợp lệ | Tài xế được tạo `PENDING` | Thấp | — | Chưa thực thi |
| TC-36 | O08, AD05 / BR-13 | Rút tiền | Rút < 100.000đ; rút hợp lệ; Admin duyệt | Lỗi số tiền tối thiểu; lệnh `PENDING` → `COMPLETED`, số dư giảm | Cao | `OwnerWithdrawalBalanceTest` (2) | Chưa thực thi |
| TC-37 | AD03 / BR-18 | Cấu hình áp dụng ngay | Admin đổi `default_deposit_percent` 30 → 40, tạo đơn mới | Cọc đơn mới = 40% | TB | — | Chưa thực thi |
| TC-38 | AD02 | Duyệt hoàn tiền | Admin duyệt / từ chối refund `PENDING`; duyệt lại refund đã xử lý | `SUCCESS` / `CANCELLED`; xử lý lại bị từ chối | TB | `RefundServiceTest.testApproveAlreadyProcessedRefund` | Chưa thực thi |
| TC-39 | NFR-02 | Phân quyền | Khách gọi `/admin/**`, `PUT /bookings/{id}/paid`, `POST /payments/{id}/refund`; người chưa đăng nhập gọi `/driver/assignments/booking/{id}` | Bị từ chối (401/403) | Cao | — | Chưa thực thi |
| TC-40 | BR-17 | Tải file giả mạo | Đổi đuôi file không phải ảnh thành `.jpg`; ảnh > 5 MB | Bị từ chối | TB | `FileStorageImageTest` (4) | Chưa thực thi |
| TC-41 | C19 | Thông báo | Thực hiện TC-12, quan sát biểu tượng chuông của chủ xe | Số chưa đọc tăng trong ≤ 30 giây; đánh dấu đã đọc / xóa hoạt động | TB | — | Chưa thực thi |
| TC-42 | AI02 | AI trả lời chính sách | Khách vãng lai hỏi "chính sách hoàn cọc thế nào?" | Trả lời theo tài liệu `01-chinh-sach-hoan-coc.md` (100% / 70% / 50% / 0%) | TB | — | Chưa thực thi |
| TC-43 | AI03 | AI tra cứu đơn | Khách đăng nhập hỏi "kiểm tra đơn của tôi" | Liệt kê tối đa 5 đơn thật của khách | TB | — | Chưa thực thi |
| TC-44 | AI | Sức khỏe AI service | `GET /health`, `POST /ai/chat` "Xin chào" | HTTP 200, `status = healthy`, có `reply` | Thấp | `tests/test_chat.py` (2) | Chưa thực thi |

## 7. Kiểm kê kiểm thử tự động hiện có

### 7.1 Backend — `backend/src/test` (JUnit 5 + Mockito)

Ở mốc review (`docs/bao-cao-review.md`): 17 lớp test, 74 phương thức (`@Test` / `@ParameterizedTest`) → **82 lượt chạy** (3 phương thức tham số hóa sinh 4 + 4 + 3 lượt), gồm 1 `contextLoads` cần PostgreSQL.
Sau đợt hoàn thiện (28/11): thêm `TokenBlacklistServiceTest` (4 test) → 18 lớp, 78 phương thức, **86 lượt** (85 unit test chạy độc lập + 1 `contextLoads` cần PostgreSQL). Kết quả chạy `mvnw test` ngày 28/11: 85/85 unit test đạt.

| Lớp test | Lượt | Nội dung kiểm tra |
|---|---|---|
| `BackendApplicationTests` | 1 | `contextLoads` — nạp toàn bộ Spring context; **cần PostgreSQL đang chạy** |
| `admin/service/OwnerWithdrawalBalanceTest` | 2 | Lệnh rút `PENDING` không bị tính là đã rút nhưng vẫn giữ chỗ số dư |
| `auth/service/AuthServiceTest` | 4 | Sai mật khẩu, trùng SĐT, tài khoản bị khóa, cập nhật hồ sơ |
| `booking/service/BookingCancelNoDriverTest` | 4 | Đơn có tài xế nhưng không còn tài xế: không hủy lại được ở `CANCELLED/COMPLETED/RETURNED/RENTED` (tham số hóa) |
| `booking/service/BookingRefundNotificationTest` | 9 | Hủy/từ chối/tự hủy có/không cọc → có/không tạo refund và thông báo Admin |
| `booking/service/BookingServiceTest` | 6 | Đặt xe khi chưa KYC, ngày không hợp lệ, trùng lịch chặn; hủy đơn đã hoàn thành/đã hủy; tự hủy đơn chủ xe chưa duyệt |
| `booking/service/PricingServiceTest` | 4 | Tiền cọc, tổng tiền, giá cuối tuần theo từng ngày, xe không có giá cuối tuần |
| `common/security/TokenBlacklistServiceTest` *(mới)* | 4 | Thu hồi token lưu băm với TTL còn lại, bỏ qua token đã hết hạn, phát hiện token đã thu hồi, Redis lỗi thì fail-open |
| `common/service/FileStorageImageTest` | 4 | Chặn giả đuôi, sai loại, file rỗng/quá lớn; nhận ảnh hợp lệ |
| `handover/service/HandoverDriverAcceptedTest` | 14 | Chặn lập biên bản khi tài xế chưa nhận / bị đổi tài xế (7 test thường + 2 phương thức tham số hóa: 4 + 3 lượt) |
| `handover/service/HandoverKmOverageTest` | 6 | Trong định mức, ODO trả < ODO nhận, vượt giới hạn, giá cuối tuần, đơn có tài xế, không có biên bản nhận |
| `handover/service/HandoverLateFeeTest` | 7 | Các mốc phí trễ, đúng giờ, trễ nhiều ngày |
| `handover/service/HandoverServiceTest` | 5 | Điều kiện tạo/ký biên bản |
| `payment/gateway/MomoGatewaySignatureTest` | 4 | Chữ ký hợp lệ, payload bị sửa, thiếu chữ ký, credential DEMO bị từ chối |
| `payment/service/PaymentAmountTest` | 2 | Số tiền DEPOSIT / REMAINING do server tính |
| `payment/service/RefundServiceTest` | 1 | Không duyệt lại refund đã xử lý |
| `review/service/ReviewCustomerReplyTest` | 3 | Quyền trả lời của khách |
| `review/service/ReviewThreadReplyTest` | 6 | Hội thoại phản hồi nhiều lượt, chặn người ngoài, gộp phản hồi cũ và mới |
| **Tổng** | **86** (82 ở mốc review + 4) | |

Kết quả gần nhất có ghi nhận: theo `docs/bao-cao-review.md` mục 8, `mvnw test` cho **81/81 pass** (không tính `contextLoads` vì máy không chạy PostgreSQL) — con số này chưa gồm `TokenBlacklistServiceTest`. Cần chạy lại toàn bộ sau khi các thay đổi đang ở working tree được commit.

Lệnh chạy:
```bash
cd backend
./mvnw test            # Windows: .\mvnw.cmd test
# Bỏ qua contextLoads khi không có PostgreSQL:
./mvnw test -Dtest='!BackendApplicationTests'
```

### 7.2 AI service — `ai-service/tests/test_chat.py` (pytest)

| Test | Nội dung |
|---|---|
| `test_health` | `GET /health` trả 200, `status = healthy` |
| `test_chat` | `POST /ai/chat` với "Xin chào" trả 200 và có trường `reply` |

Ghi chú: test khởi tạo ứng dụng thật (nạp mô hình embedding, ChromaDB); `test_chat` gọi Gemini nếu có `GEMINI_API_KEY`. Chưa có kết quả chạy được ghi nhận trong repo. Lệnh: `cd ai-service && pytest tests`.

### 7.3 Frontend
- **Không có test tự động** (không có Jest/Vitest/Playwright trong `frontend/package.json`).
- Kiểm thử thủ công theo 10 bộ đặc tả trong `docs/frontend-verification/`. Mỗi trang có 12 kịch bản chuẩn: điều hướng trực tiếp, truy cập đúng quyền, chưa đăng nhập, sai vai trò, tải lại trang, mạng chậm, mất mạng, bố cục responsive, điều hướng bàn phím, dữ liệu/định danh không hợp lệ, thao tác lặp, nhất quán trạng thái.

| File | Trang được đặc tả | Số kịch bản |
|---|---|---|
| `01-public-navigation.md` | HomePage, SearchPage (2 route), CarDetailPage | 48 |
| `02-authentication.md` | LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, ProfilePage | 60 |
| `03-account-verification.md` | VerificationPage, OwnerRegisterPage | 24 |
| `04-booking-management.md` | BookingPage, MyBookingsPage, BookingDetailPage, Navigate | 48 |
| `05-payment-management.md` | PaymentPage, PaymentFinalPage | 24 |
| `06-vehicle-management.md` | OwnerCarsPage, CreateCarPage, CarEditPage | 36 |
| `07-owner-operations.md` | OwnerDashboard, OwnerBookingsPage, OwnerDriversPage, OwnerWithdrawalsPage | 48 |
| `08-handover-and-driver.md` | HandoverPage, DriverAssignmentPage | 24 |
| `09-reviews-notifications.md` | ReviewPage (2 route), OwnerReviewsPage, NotificationsPage | 48 |
| `10-administration.md` | 9 trang Admin + Navigate | 120 |
| **Tổng** | | **480** |

Trạng thái: cả 10 file đều ghi "Executed scenarios: 0 / Passed: Not evaluated". Khi thực thi, cập nhật cột "Execution status" của từng kịch bản và bảng "Execution summary".
- ESLint hiện báo lỗi ở nhiều file (`npx eslint src`, xem `docs/bao-cao-review.md` mục 2.10) — cần xử lý nếu đặt tiêu chí "build không cảnh báo".

## 8. Quản lý lỗi
- Mỗi lỗi ghi: mã (BUG-xx), ca kiểm thử liên quan, bước tái hiện, kết quả thực tế/mong đợi, mức độ (Nghiêm trọng / Cao / TB / Thấp), người xử lý, commit sửa.
- Mức độ: **Nghiêm trọng** = sai tiền, lộ dữ liệu, vượt quyền, chặn luồng chính; **Cao** = sai nghiệp vụ có cách né; **TB/Thấp** = giao diện, thông điệp.
- Lỗi đã phát hiện và sửa trong đợt review (bảo mật thanh toán, phân quyền API tài xế, giá cuối tuần, lịch chặn, phí trễ nhiều ngày, số chỗ 4/5/7) được liệt kê ở `docs/bao-cao-review.md` mục 8 và có unit test tương ứng.

## 9. Rủi ro kiểm thử

| Rủi ro | Biện pháp |
|---|---|
| Các mốc thời gian dài (12h, 4h, 3h, 48h) khó kiểm thử thật | Chỉnh cột thời gian trong CSDL; logic đã có unit test cho các nhánh chính |
| SMS/MoMo là giả lập nên không kiểm chứng tích hợp thật | Ghi rõ phạm vi; kiểm tra chữ ký MoMo bằng unit test |
| Phụ thuộc Gemini (khóa API, hạn mức) làm test AI không ổn định | Chỉ kiểm tra cấu trúc phản hồi; đánh giá nội dung thủ công |
| Không có CI nên hồi quy dễ bị bỏ sót | Bắt buộc chạy `mvnw test` trước khi merge PR |

## 10. Sản phẩm bàn giao của kiểm thử
1. Tài liệu này (`docs/test-plan.md`).
2. Mã unit test backend và AI service.
3. 10 bộ đặc tả kiểm thử giao diện có cột kết quả.
4. Báo cáo kết quả thực thi (bảng mục 6 sau khi cập nhật, ảnh chụp màn hình, nhật ký lỗi).
