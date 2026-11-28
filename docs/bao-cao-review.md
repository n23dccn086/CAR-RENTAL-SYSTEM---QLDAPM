# Review báo cáo đồ án đối chiếu với mã nguồn

> Đối tượng: file `báo cáo đồ án CAR RENTAL SYSTEM-QLDAPM.pdf` (55 trang, bản tháng 11/2026), đối chiếu với nhánh `main` tại commit `debc0f8` (28/11/2026) **cộng các bản sửa trong đợt review này** (mục 8).
> Góc nhìn: giảng viên chấm khắt khe + bot review. Mọi nhận xét đều có bằng chứng trong repo (đường dẫn file / lệnh kiểm tra).

> **Cập nhật – đợt hoàn thiện (28/11/2026):** toàn bộ các mục dưới đây đã được xử lý:
> - Báo cáo đã được dựng lại và đính chính: `Bao_Cao_Do_An_Car_Rental_System_QLDAPM.docx` / `.pdf` ở thư mục gốc. Bản PDF cũ được giữ nguyên để đối chiếu.
> - Mã nguồn: sửa toàn bộ mục 8 và mục 9 (xem trạng thái ✅ ở mục 9).
> - Tài liệu `docs/*` đã có nội dung; bổ sung `docs/api-endpoints.md`, sinh bằng `scripts/gen-api-endpoints.js`.
> - Phần còn lại cần nhóm tự xử lý: điền "Lớp", ký Lời cam đoan; rà lại bảng đóng góp với thực tế (mục 6.3); bổ sung ảnh Trello/burndown nếu có.
>
> Các mục 0–8 bên dưới giữ nguyên nội dung review ban đầu để làm hồ sơ QA.

---

## 0. Kết luận

**Chưa nên nộp nguyên trạng.** Báo cáo mô tả một hệ thống *khác* với hệ thống trong repo ở 3 điểm:

1. **Số liệu sai lệch:** 64 endpoint (thực tế 173), 28 trang (38), 23 bảng (24), Gemini 1.5 Flash (model này đã bị Google ngừng; code dùng 2.5 Flash).
2. **Khẳng định công nghệ không có trong code:** WebSocket realtime, email, Redis cache cấu hình / blacklist JWT, Cloudinary, xuất Excel, giữ lịch 15 phút, cronjob mỗi 1 giờ.
3. **Quy trình quản lý dự án mâu thuẫn với lịch sử git:** báo cáo nói 6 Sprint × 1 tuần, nghiệm thu giữa tháng 10. Nhưng git cho thấy dự án chạy từ 02/10 đến 28/11 (~8 tuần), và nhiều tính năng lớn được viết **sau** mốc "nghiệm thu". Ngoài ra, 85 commit đẩy thẳng lên `main`, trong khi báo cáo khẳng định "mọi dòng code đều qua PR được Tech Lead review".

Ngược lại, code có **nhiều chức năng tốt mà báo cáo bỏ quên**: hàng đợi Redis có khôi phục khi sập server, luồng thanh toán quyết toán, chuỗi phản hồi đánh giá, quên mật khẩu bằng OTP, quản lý người dùng, kiểm duyệt đánh giá… Đây là điểm cộng nhóm đang tự bỏ phí.

---

## 1. Số liệu sai — bắt buộc sửa

| # | Vị trí trong báo cáo | Báo cáo ghi | Thực tế trong code | Cách kiểm tra | Sửa thành |
|---|---|---|---|---|---|
| 1.1 | Tóm tắt, 1.2 (M), 4.1, 6.2, 9.1, bảng đóng góp | **64** REST API endpoints | **173** phương thức xử lý trong 28 controller (tính cả alias JSON/multipart). `openapi.yaml` chỉ đặc tả **89** operation → tài liệu API cũng đã lỗi thời so với code | `grep -rcE "@(Get\|Post\|Put\|Patch\|Delete)Mapping" backend/src/main` | "Hơn 170 endpoint REST (89 endpoint cốt lõi được đặc tả trong OpenAPI)" — và nên cập nhật `openapi.yaml` |
| 1.2 | Bảng đóng góp, 2.2, 3.1 (WBS 5.0), 3.3, 9.1 | **28** trang giao diện | **38** page component trong `frontend/src/pages`, **40** route trong `App.jsx` | `ls frontend/src/pages \| wc -l` | "38 màn hình (40 route)" |
| 1.3 | 4.1, 9.1, Phụ lục F | **23** thực thể / bảng | **24** bảng: thiếu `review_replies` (V37) | `grep -h "CREATE TABLE" backend/src/main/resources/db/migration/*.sql` | Thêm `review_replies` vào nhóm 4 "Giao nhận & Tương tác", sửa thành 24. Vẽ lại ERD |
| 1.4 | 1.3 (In-Scope 6), Tài liệu tham khảo [6] | Google **Gemini 1.5 Flash** | `ai-service/.env.example`: `gemini-2.5-flash`. Default trong `config.py` đã được sửa về 2.5 trong đợt này | `ai-service/app/core/config.py` | "Google Gemini 2.5 Flash". Gemini 1.5 đã ngừng hoạt động, hội đồng có thể hỏi |
| 1.5 | Phụ lục E | "30 hoàn thiện, **7** MVP, 2 đặc tả" | Danh sách chỉ gắn nhãn **6** MVP (C07, O03, O04, D02, D03, AI04) và 2 đặc tả (D04, D05) → 31 / 6 / 2 | Đếm trong chính Phụ lục E | Thống nhất lại con số, hoặc gắn nhãn đúng UC còn thiếu |
| 1.6 | 1.2 (T), 2.1, 4.1, 9.1 | **6** Sprint / 6 tuần | Chính 4.1 liệt kê Sprint 0, 1, 2, 3, 4, 5&6 = **7** Sprint. Mục 1.4 ghi "Mốc 4 (Sprint 6 – **Tuần 7**)". Git: 02/10 → 28/11 ≈ **8 tuần** | `git log --reverse --date=short` | Xem mục 6.1 |
| 1.7 | Bảng 6.1 vs Phụ lục D | TC01–TC08 | **Cùng mã TC nhưng khác nội dung**: Bảng 6.1 TC02 = "Admin duyệt xe", Phụ lục D TC02 = "Đăng nhập sai mật khẩu"; Bảng 6.1 TC03 = "Từ chối hồ sơ tài xế", Phụ lục D TC03 = "Nộp KYC"… | So 2 bảng | Dùng **một** bộ mã duy nhất. Bảng 6.1 phải trích đúng mã của Phụ lục D |
| 1.8 | Bảng 3.1 RTM, REQ-05 | Kịch bản TC12, TC13, **TC19** | TC19 = "Duyệt lệnh rút tiền", không liên quan hủy đơn | Phụ lục D | REQ-05 → TC12, TC13 |

## 2. Báo cáo khẳng định nhưng code KHÔNG có — rút bỏ hoặc ghi đúng

| # | Vị trí | Báo cáo ghi | Thực tế | Bằng chứng | Văn bản thay thế đề xuất |
|---|---|---|---|---|---|
| 2.1 | Bảng đóng góp (Đinh Việt Hoàng), 3.1 WBS 3.0, 1.3 Out-of-scope #3 | Thông báo **thời gian thực qua WebSocket** và **email** | Không có cấu hình WebSocket/STOMP nào, frontend không mở socket. Thông báo được lưu DB, frontend **polling 30 giây**. Không có `JavaMailSender`. Hai dependency `starter-websocket` và `starter-mail` khai báo trong pom nhưng không dùng | `frontend/src/components/WheelNav.jsx:19` (`setInterval(fetchUnreadCount, 30000)`) | "Thông báo trong ứng dụng (in-app), lưu CSDL, giao diện tự cập nhật 30 giây/lần. WebSocket và email nằm ngoài phạm vi (hướng phát triển)." |
| 2.2 | 2.4 Tech stack | "Sử dụng **Redis để cache dữ liệu cấu hình**" | Cache cấu hình là `ConcurrentHashMap` trong bộ nhớ, TTL 60 giây, có `clearCache()`. Redis **chỉ** dùng làm hàng đợi hủy đơn (ZSET) | `admin/service/ConfigHelper.java:16-28`, `booking/service/BookingDelayedQueueService.java` | "Redis 7 làm hàng đợi trễ (Delayed Queue, ZSET) cho cơ chế tự hủy đơn quá hạn; cấu hình nền tảng được cache trong bộ nhớ (TTL 60s), xóa cache ngay khi Admin cập nhật." |
| 2.3 | Bảng 5.1 | Redis "**Blacklist JWT token**" | `logout()` không làm gì phía server (chỉ ghi log); không có blacklist | `auth/service/AuthServiceImpl.java:119-121` | Bỏ "Blacklist JWT", ghi "Delayed queue hủy đơn". Nếu muốn giữ, phải viết code blacklist |
| 2.4 | Bảng 5.1 | **Cloudinary** lưu ảnh/chữ ký | Không có Cloudinary. File lưu trên đĩa server `backend/uploads`, phục vụ qua `/api/v1/files/**` | `common/service/FileStorageService.java:25` | Bảng dự toán vẫn có thể ghi Cloudinary/S3 nhưng phải nói rõ là **phương án khi triển khai**, hiện tại lưu local |
| 2.5 | 2.4 | Hỗ trợ **xuất** file Excel | Chỉ có **nhập** (xe + tài xế). Không có code ghi workbook | `car/service/ExcelImportService.java` | "Nhập (import) xe và tài xế từ Excel 11 cột (Apache POI)" |
| 2.6 | US-01 (3.2) | "**Khóa lịch xe tạm thời 15 phút** chờ thanh toán" | Không có cơ chế 15 phút. Đơn `PENDING` chiếm lịch đến khi bị tự hủy sau **12 giờ** chưa cọc | `booking/service/BookingScheduler.java:44` (`PENDING_TIMEOUT_HOURS = 12`) | "…giữ lịch xe tối đa 12 giờ chờ thanh toán cọc; quá hạn hệ thống tự hủy đơn." |
| 2.7 | 3.3 (đoạn Cronjob) | "Cronjob chạy **mỗi 1 giờ**; quá **4 giờ kể từ lúc tạo đơn** mà khách chưa cọc **hoặc** chủ xe chưa duyệt thì hủy" | Có **3** tác vụ định kỳ và **2** ngưỡng khác nhau: (a) đơn `PENDING` chưa cọc quá **12h** → hủy (quét 5 phút/lần); (b) đơn `PAID` chủ xe chưa duyệt quá **4h tính từ lúc cọc** → hủy + hoàn 100% cọc, qua **Redis ZSET** quét mỗi phút, có **khôi phục khi server khởi động lại** và fallback quét DB khi Redis lỗi; (c) phân công tài xế quá 3h → hết hạn, gán người tiếp theo (quét mỗi phút). Thêm `DisputeDeadlineScheduler` quét hạn tranh chấp 5 phút/lần | `BookingScheduler.java`, `AssignmentScheduler.java`, `DisputeDeadlineScheduler.java` | Xem đoạn viết lại ở mục 7.1 |
| 2.8 | Tóm tắt, 3.3, US-08 | "Magic Link **gửi qua SMS**" | SMS là **giả lập**: `MockNotificationSender` in nội dung ra console. Không có nhà cung cấp SMS. Link hard-code `http://localhost:5173` | `notification/service/MockNotificationSender.java`, `DriverAssignmentServiceImpl.java:613` | "Magic Link gửi qua kênh SMS giả lập (in ra console trong môi trường demo); tích hợp nhà mạng SMS là hướng phát triển." |
| 2.9 | Bảng 3.1 RTM | `AdminCarsPage.jsx` | Không tồn tại. Duyệt xe nằm ở `AdminApprovalsPage.jsx`. Luồng đặt xe ở `BookingPage.jsx`, không phải `CarDetailPage.jsx` | `ls frontend/src/pages` | REQ-02 → `AdminApprovalsPage.jsx`, REQ-03 → `BookingPage.jsx` (+`PaymentPage.jsx`) |
| 2.10 | 6.1 DoD (1) | "Build thành công, **không có warning**" | Frontend: ESLint báo **100 lỗi, 17 cảnh báo** ở 33 file. Backend: test `contextLoads` lỗi nếu không có PostgreSQL chạy | `npx eslint src` | Hoặc sửa lint cho sạch, hoặc bỏ câu "không có warning" |
| 2.11 | 6.2 (Lớp 2) | Postman kiểm thử "toàn bộ 64 endpoint" | Không có Postman collection nào trong repo. Endpoint thực tế là 173 | — | Đưa collection (`.json`) vào repo làm minh chứng, hoặc viết lại cho đúng phạm vi đã test |

## 3. Kịch bản kiểm thử mà kết quả kỳ vọng sai với code

| TC (Phụ lục D) | Báo cáo kỳ vọng | Code tính ra | Ghi chú |
|---|---|---|---|
| **TC16** – vượt 100 km | "tính đúng **500.000đ**" | **650.000đ** = 50 km × 5.000 + 50 km × 8.000 (phí km đa bậc theo V23) | `HandoverServiceImpl.calculateKmOverage`. Trừ khi config đã bị đổi, TC này **không thể Pass** như mô tả |
| **TC17** – trả muộn 2 tiếng | "phí theo biểu phí cấu hình" (ngụ ý theo giờ) | **50% đơn giá ngày** (mốc 1h–4h). Phí theo giờ `default_late_fee_per_hour` chỉ áp cho trễ 15–60 phút | Ghi rõ bảng mốc: <15' miễn phí · 15–60' = phí 1 giờ · 1–4h = ½ ngày · 4–24h = 1 ngày · mỗi 24h trọn = 120% ngày (mốc cuối đã sửa, xem 8.4) |
| **TC14** – thanh toán cọc | "xe chuyển trạng thái **chuẩn bị bàn giao**" | Đơn → `PAID` (chờ chủ xe duyệt); **xe → `RENTED`** | `PaymentServiceImpl.handleMockCallback`. Xem thêm 9.2 |
| **TC11** – đặt xe | "khóa lịch xe" | Đúng là chặn trùng lịch, nhưng **lịch chủ xe chặn tay trước đây không được kiểm tra ở server** (đã sửa, 8.3) | — |
| TC01 | HTTP 201 + JWT | ✅ Đúng (`@ResponseStatus(CREATED)`) | — |
| TC02 | HTTP 401 | ✅ Đúng (`INVALID_CREDENTIALS`) | — |

## 4. Có trong code nhưng báo cáo KHÔNG nhắc — nên bổ sung (điểm cộng)

| Chức năng | Bằng chứng | Gợi ý đưa vào |
|---|---|---|
| **Hàng đợi hủy đơn bằng Redis ZSET** + khôi phục khi server sập + fallback quét DB | `BookingDelayedQueueService`, `BookingScheduler.onApplicationStartup` | 3.3 và 4.3. Đây là giải pháp kỹ thuật tốt hơn "cronjob 1 giờ" mà báo cáo đang mô tả |
| **Thanh toán quyết toán** phần còn lại + phụ phí sau khi trả xe | `PaymentType.REMAINING`, `PaymentFinalPage.jsx` | UC-C07 / luồng 3.2 |
| **Quên mật khẩu bằng OTP**, đổi mật khẩu | `/auth/forgot-password`, `/auth/reset-password`, `OtpServiceImpl`, bảng `password_reset_otps` | Thêm UC phân hệ Khách hàng |
| **Phản hồi đánh giá nhiều lượt** (chủ xe ↔ khách) | `review_replies` (V36, V37), `ReviewThread.jsx`, `OwnerReviewsPage.jsx` | Mở rộng UC-C10 |
| **Admin kiểm duyệt đánh giá** | `AdminReviewsPage.jsx`, `DELETE /reviews/{id}` | Thêm UC Admin |
| **Admin quản lý người dùng** (khóa/mở/xóa, xem hồ sơ xác minh) | `AdminUserController` | Thêm UC Admin |
| **Quỹ cọc tạm giữ** (Admin) | `/admin/dashboard/deposits` | Đã có hình 9.4 nhưng chưa có UC/mô tả |
| **Trung tâm thông báo** (đọc, xóa, xóa hàng loạt) | `NotificationController` (7 endpoint), `NotificationsPage.jsx` | Thêm UC chung |
| **Khiếu nại / phản tố tranh chấp từ phía khách & chủ xe** | `DisputeController` (accept, counter-evidence, submit-review), `DisputesPage.jsx` | UC-AD02 hiện chỉ mô tả phía Admin |
| **Giới hạn ODO chống nhập nhầm** (max km vượt/ngày, tổng) | `HandoverServiceImpl.calculateKmOverage` | 3.3 / US-05 |
| **Bộ đặc tả kiểm thử giao diện** (10 file) | `docs/frontend-verification/` | Chương 6, minh chứng cho QA |
| **81 unit test backend** (JUnit 5 + Mockito) | `backend/src/test` | 6.2 Lớp 1: nêu con số và kết quả chạy |

## 5. Tài liệu dự án trong repo rỗng

`docs/srs.md`, `docs/project-charter.md`, `docs/test-plan.md`, `docs/user-manual.md`, `docs/database-schema.sql`, `docs/erd.puml`, `docs/use-case-diagram.puml` đều **0 byte** từ commit đầu tiên tới nay (`git log -- docs/srs.md`).

Báo cáo lại ghi "Xây dựng tài liệu SRS, ERD 23 bảng…" là sản phẩm của Sprint 0. Hội đồng mở repo sẽ thấy file rỗng. Có hai cách xử lý: đưa nội dung thật vào (SRS và charter có thể đang nằm trong `CAR RENTAL SYSTEM-QLDAPM.pdf`), hoặc xóa các file placeholder và ghi rõ tài liệu nằm ở đâu.

## 6. Mâu thuẫn về quản lý dự án (giảng viên QLDAPM chắc chắn hỏi)

### 6.1 Lịch trình
- Báo cáo: 6 Sprint × 1 tuần. Biên bản Daily ngày 15/10/2026 là "Sprint 6", mốc nghiệm thu cuối.
- Git: commit đầu **02/10/2026**, commit cuối **28/11/2026**. Có 125 commit trong tháng 10 và **23 commit trong tháng 11**. Sau 15/10 vẫn có: quản lý tài xế + màn tranh chấp (16–17/10), **hàng đợi Redis** (31/10), **unit test** (31/10–01/11), booking/handover/review/payment (14–16/11), **rút tiền chủ xe** (20/11), đặc tả test giao diện (25/11), trang chi tiết đơn (28/11).
- **Cần làm:** viết lại Chương 4 theo đúng dòng thời gian thật. Ví dụ: 6 Sprint phát triển + một giai đoạn "ổn định & mở rộng" từ 16/10 đến 28/11, có Sprint/Change Request tương ứng. Cách này còn tạo được ví dụ thật cho mục 2.5 Quản lý thay đổi.

### 6.2 Git Flow và review PR
- Báo cáo (2.3, 8.2): Git Flow có nhánh `develop`; "mọi dòng code trước khi merge vào main đều phải được Tech Lead review".
- Git: chỉ có **20** merge PR. Có **85** commit non-merge nằm trực tiếp trên first-parent của `main` (`git log --first-parent --no-merges main`). Nhánh tên là `dev` chứ không phải `develop`, và các PR gần đây merge thẳng vào `main`. Nhiều commit message vi phạm quy ước "feat/fix/docs/refactor" mà chính báo cáo đặt ra: `add V30`, `fix bug`, `update handover`, `requiements.txt`…
- **Cần làm:** mô tả đúng thực tế (giai đoạn đầu commit trực tiếp, từ PR #11 mới chuyển sang PR), coi đây là bài học kinh nghiệm. Đừng khẳng định quy trình mà git không chứng minh được.

### 6.3 Bảng đóng góp và lịch sử commit
Số commit non-merge theo tác giả (`git shortlog -sn --all --no-merges`): `Nguyen Le Nhut Hao` 83, `trankhoan06` 35, `VietHoang` 12, `N23DCCN090` 2.

Riêng `frontend/src`: Hào 76, trankhoan06 27, N23DCCN090 2; tài khoản `VietHoang` có 0 commit vào `frontend/src`. 12 commit của `VietHoang` là tài liệu đặc tả test và `requiements.txt`.

Bảng đóng góp ghi Đinh Việt Hoàng "phát triển toàn bộ 28 trang giao diện". Số commit không phải thước đo duy nhất: có thể có pair programming hoặc commit qua máy người khác. Nhưng giảng viên sẽ đối chiếu, nên nhóm cần **giải thích kèm minh chứng** (Trello, PR review, buổi pair) hoặc **điều chỉnh bảng** cho khớp.

### 6.4 Số liệu không có minh chứng
"Vận tốc ~28 SP/Sprint", "Bus Factor = 3", "phát hiện hơn 15 lỗi", "pass 100% UAT", "phản hồi AI dưới 5 giây": không có burndown chart, bug log, biên bản UAT hay số đo thời gian phản hồi nào trong báo cáo hoặc repo. Nên bổ sung ảnh Trello/burndown, bảng bug, biên bản UAT có chữ ký, hoặc hạ giọng khẳng định.

## 7. Đoạn văn viết lại sẵn (dán vào báo cáo)

### 7.1 Thay đoạn "Cronjob" ở mục 3.3
> Hệ thống triển khai các tác vụ nền định kỳ (Spring `@Scheduled`) kết hợp hàng đợi trễ trên Redis:
> • **Đơn chưa thanh toán cọc** (`PENDING`) quá 12 giờ kể từ khi tạo sẽ tự động bị hủy; tác vụ quét mỗi 5 phút và thông báo cho cả khách và chủ xe.
> • **Đơn đã cọc nhưng chủ xe chưa duyệt** (`PAID`) quá 4 giờ kể từ thời điểm cọc: ngay khi thanh toán, mã đơn được đưa vào Redis Sorted Set với điểm là hạn chót; tác vụ quét mỗi phút để hủy đơn và hoàn 100% tiền cọc. Khi server khởi động lại, hệ thống đối soát Redis với CSDL để xử lý các đơn quá hạn trong lúc ngừng hoạt động. Nếu Redis mất kết nối, hệ thống tự chuyển sang quét trực tiếp CSDL.
> • **Phân công tài xế**: mỗi lượt phân công có hạn phản hồi 3 giờ qua Magic Link; quá hạn, tác vụ quét mỗi phút đánh dấu hết hạn và tự gán tài xế rảnh kế tiếp (tối đa 5 lượt).
> • **Tranh chấp**: tác vụ quét mỗi 5 phút để chuyển trạng thái khi hết hạn phản tố 48 giờ hoặc hạn bổ sung bằng chứng 24 giờ.

### 7.2 Thay đoạn Tech Stack Backend (2.4)
> Backend: Java 21, Spring Boot 4.0.8, PostgreSQL 15 (Flyway, 37 migration, 24 bảng), Spring Security + JWT (Access/Refresh token, stateless). Redis 7 làm hàng đợi trễ cho cơ chế tự hủy đơn. Apache POI để nhập xe/tài xế từ Excel, Apache PDFBox để xuất biên bản phán xử tranh chấp. Ảnh, chữ ký và giấy tờ lưu trên ổ đĩa server. Tài liệu API sinh tự động bằng springdoc-openapi (Swagger UI).

### 7.3 Phụ lục F – nhóm 4
> 4. Phân hệ Giao nhận & Tương tác: handover_records, handover_images, reviews, **review_replies**, disputes, notifications.
> → Tổng cộng **24** thực thể.

### 7.4 Out-of-scope #3
> 3. Hệ thống tổng đài, SMS thật, email và thông báo đẩy thời gian thực (WebSocket). Phiên bản hiện tại dùng thông báo trong ứng dụng (tự cập nhật 30 giây/lần) và SMS giả lập cho Magic Link.

### 7.5 TC16, TC17 (Phụ lục D)
> • TC16 – Biên bản nhận xe & phí vượt km: thuê 1 ngày (định mức 300 km), chạy 400 km (vượt 100 km) → hệ thống tính 50×5.000 + 50×8.000 = **650.000đ**.
> • TC17 – Phí trả xe trễ: trễ 2 giờ → thu **50% đơn giá ngày** theo bảng mốc (15–60 phút: phí 1 giờ; 1–4 giờ: ½ ngày; 4–24 giờ: 1 ngày; mỗi 24 giờ trọn: 120% đơn giá ngày).

## 8. Lỗi code đã sửa trong đợt review này

Toàn bộ thay đổi đang ở working tree (**chưa commit**). Unit test backend: **81/81 pass** (`mvnw test`, trừ `contextLoads` vì cần PostgreSQL đang chạy). Frontend `vite build` thành công.

| # | Mức | Lỗi | Sửa | File |
|---|---|---|---|---|
| 8.1 | 🔴 Bảo mật | Callback MoMo là endpoint public, `verifySignature()` **luôn trả true**. Nếu không tìm thấy `orderId`, hệ thống **lấy payment PENDING đầu tiên trong toàn hệ thống** đánh dấu thành công → bất kỳ ai POST `resultCode=0` cũng "thanh toán hộ" đơn của người khác | Xác minh HMAC-SHA256 theo chuẩn IPN MoMo v2; với credential DEMO thì từ chối callback (demo đi qua `mock-success`, cần JWT). Bỏ fallback "payment PENDING đầu tiên" | `payment/gateway/MomoGateway.java`, `payment/service/PaymentServiceImpl.java` (+ `MomoGatewaySignatureTest`, 4 test) |
| 8.2 | 🔴 Bảo mật | `PUT /bookings/{id}/paid` và `POST /payments/{id}/refund`: **mọi user đã đăng nhập** đều gọi được → tự đánh dấu đã cọc / tự hoàn tiền | Chỉ `ADMIN` (`@PreAuthorize`). Frontend không gọi 2 API này | `BookingController.java`, `PaymentController.java` |
| 8.3 | 🔴 Bảo mật | `POST /payments/{id}/mock-success`: user A giả lập thanh toán cho payment của user B | Chỉ chủ payment hoặc Admin | `PaymentController.java` |
| 8.4 | 🔴 Bảo mật | `/driver/assignments/booking/**` nằm trong filter chain public. **Không cần đăng nhập** vẫn xem được tài xế, SĐT, **magic-link token** của mọi đơn, và kích hoạt auto-assign | Bắt buộc JWT và là chủ đơn (hoặc Admin); không trả token về API của chủ xe | `driver/controller/DriverAssignmentController.java` |
| 8.5 | 🟠 Nghiệp vụ | **Giá cuối tuần**: lấy giá của *ngày nhận xe* nhân cho cả đơn (thuê T6→T2 tính toàn giá thường, T7→T4 toàn giá cuối tuần). Trái với US-01 "tính đúng ngày thường/cuối tuần". Frontend còn bỏ qua hẳn giá cuối tuần | Tính giá **từng ngày**; frontend xem trước khớp backend | `booking/service/PricingService.java`, `pages/BookingPage.jsx` (+2 test) |
| 8.6 | 🟠 Nghiệp vụ | **Lịch chủ xe chặn** (`car_blocked_dates`) chỉ hiển thị trên UI, server không kiểm tra → gọi API trực tiếp vẫn đặt được | Kiểm tra trong `createBooking` | `BookingServiceImpl.java`, `CarBlockedDateRepository.java` (+1 test) |
| 8.7 | 🟠 Nghiệp vụ | **Phí trả trễ** ≥ 24h bị chặn trần ở 120% *một* ngày → trả trễ 5 ngày vẫn chỉ mất 1,2 ngày tiền | Mỗi 24h trọn = 120% đơn giá ngày, phần lẻ theo bảng mốc. Test cũ (24h7' = 840.000đ) vẫn đúng | `HandoverServiceImpl.java`, `HandoverFormModal.jsx` (+1 test) |
| 8.8 | 🟡 Phạm vi | Phạm vi cam kết "chỉ xe 4, 5, 7 chỗ", nhưng API và import Excel nhận **2–30 chỗ**, form tạo xe cho nhập số tự do | Validate {4, 5, 7} ở DTO và Excel; form dùng dropdown | `CarRequest.java`, `ExcelImportService.java`, `CreateCarPage.jsx`, `CarEditPage.jsx` |
| 8.9 | 🟡 Cấu hình | Default `gemini-1.5-flash` (model đã ngừng) | `gemini-2.5-flash` | `ai-service/app/core/config.py`, `ai-service/README.md` |
| 8.10 | 🟡 Tài liệu | README ghi VNPay, Redis Blacklist, Cloudinary, WebSocket STOMP, xuất Excel; biến môi trường sai tên (`DB_URL`… thay vì `HOST_POSTGRES`…); `BACKEND_URL` thiếu `/api/v1` (AI không gọi được backend) | Sửa cho đúng code | `README.md`, `backend/.env.example` |

## 9. Vấn đề tồn tại sau review đợt 1 — đã xử lý trong đợt hoàn thiện (28/11)

| # | Vấn đề | Trạng thái | Cách xử lý |
|---|---|---|---|
| 1 | Xe bị khóa toàn cục khi có 1 đơn (đặt cả lúc tạo đơn PENDING) | ✅ | Tính trống lịch theo khoảng ngày; `RENTED` chỉ khi biên bản giao xe đã ký; tìm kiếm không còn ẩn xe có đơn tương lai (`CarRepository`, `BookingServiceImpl`, `PaymentServiceImpl`, `HandoverServiceImpl`, UI CarDetail/Booking/CarCard) |
| 2 | Đăng xuất không thu hồi token | ✅ | `TokenBlacklistService` (Redis, SHA-256, TTL), kiểm tra ở `JwtAuthFilter` và `/auth/refresh`; frontend gửi kèm refresh token khi logout. `TokenBlacklistServiceTest` |
| 3 | Profile `prod` thiếu bean `NotificationSender` | ✅ | Bỏ `@Profile("!prod")` |
| 4 | Upload dir hard-code | ✅ | `FileStorageService`, `FileController`, `WebMvcConfig` đọc `app.upload-dir` |
| 5 | Magic link hard-code localhost | ✅ | `app.frontend-url` / `FRONTEND_URL` |
| 6 | Phí bảo hiểm/tài xế hard-code | ✅ | `V38__add_fee_configs.sql` + `ConfigHelper`; hiển thị trên AdminConfigPage |
| 7 | Mật khẩu DB lệch | ✅ | `docker-compose.yml` dùng `123456` (lưu ý: volume Postgres đã khởi tạo trước đó vẫn giữ mật khẩu cũ) |
| 8 | ESLint 100 lỗi | ✅ | 0 lỗi, 0 cảnh báo; `vite build` thành công |
| 9 | `openapi.yaml` lệch code | ✅ (một phần) | Danh mục đầy đủ 174 endpoint: `docs/api-endpoints.md` (`node scripts/gen-api-endpoints.js`); `openapi.yaml` giữ vai trò hợp đồng chi tiết cho luồng chính |
| 10 | Test | ✅ (một phần) | Backend 85/85 unit test pass (+1 `contextLoads` cần PostgreSQL). AI service: chưa chạy được vì cần cài chromadb + sentence-transformers (PyTorch). Frontend chưa có test tự động |
| 11 | *(phát hiện thêm)* UI chủ xe không có giá cuối tuần, không có chặn lịch | ✅ | Ô giá cuối tuần ở CreateCar/CarEdit; mục thêm/gỡ lịch chặn (API `DELETE /cars/{id}/blocked-dates/{blockId}` mới); CarDetailPage hiển thị "Lịch đã kín" |
| 12 | *(phát hiện thêm)* Bỏ 2 dependency không dùng (websocket, mail) | ✅ | `pom.xml` |

**Còn tồn đọng (giới hạn đã ghi trong báo cáo, không phải lỗi):** trạng thái tranh chấp `CLOSED` chưa có luồng gán; giấy tờ xe, giá có tài xế/phí giao xe chỉ qua API; các cột giá theo từng xe (`deposit_percent`, `price_holiday`, `insurance_fee_per_day`…) chưa dùng khi tính tiền; AI service đọc role từ JWT mà không kiểm chữ ký (dữ liệu vẫn do backend kiểm quyền); 480 kịch bản UAT trong `docs/frontend-verification` chưa ghi kết quả thực thi; CORS hard-code `localhost:5173`.

## 10. Checklist sửa báo cáo — trạng thái

Tất cả các mục dưới đây đã được thực hiện trong `Bao_Cao_Do_An_Car_Rental_System_QLDAPM.docx/.pdf`, trừ các mục ghi "nhóm tự làm":

- [x] Sửa con số: 174 endpoint, 38 trang, 24 bảng, 38 migration, Gemini 2.5 Flash, 52 UC (44 hoàn thiện / 6 MVP / 2 đặc tả).
- [x] Bỏ / sửa các khẳng định WebSocket, email, Redis cache, Cloudinary, xuất Excel, 15 phút, cronjob 1 giờ, SMS thật.
- [x] Viết lại đoạn tác vụ nền, Tech stack, Out-of-scope.
- [x] Thống nhất mã TC giữa Bảng 6.1 và Phụ lục D; sửa TC14, TC16 (650.000đ), TC17; RTM 8 yêu cầu kèm unit test.
- [x] Bổ sung 13 UC mới (Phụ lục E), ghi chú sơ đồ Use Case.
- [x] Chương 4 viết lại theo 8 Sprint thật (02/10 → 28/11) với số commit từng Sprint.
- [x] Mô tả đúng quy trình Git/PR (85 commit thẳng main, 20 PR) và đưa vào bài học.
- [x] Thêm ghi chú minh chứng dưới bảng đóng góp. **Nhóm tự làm:** rà lại nội dung phân công cho khớp thực tế.
- [x] Bỏ các chỉ số không minh chứng được (velocity 28 SP, "hơn 15 lỗi", "<5 giây"); thay bằng số commit và bảng lỗi đã sửa (Bảng 6.2).
- [x] ERD vá thêm `review_replies` (24 bảng); `docs/*` đã có nội dung.
- [x] Bảng 6.2: 11 nhóm lỗi phát hiện & khắc phục; R8 (rủi ro bảo mật) trong Risk Log.
- [ ] **Nhóm tự làm:** điền "Lớp:" ở trang bìa, ký Lời cam đoan; bổ sung ảnh burndown/biên bản UAT nếu có.
