# Car Rental System - API Contract

Generated from the repository OpenAPI specification.

Source: `openapi.yaml`

Source SHA-256: `0b71af0196ef999c53ce55d3feb689e445f9a11f1b915f4c34134e9314a0f102`

This document describes the declared API contract.
It does not certify that every backend implementation
has been verified against the specification.

## 1. API Overview

| Attribute | Value |
|---|---|
| Title | Car Rental System API (Maison) |
| API version | 1.0.0 |
| OpenAPI version | 3.0.3 |
| API paths | 79 |
| Operations | 89 |
| Module groups | 14 |

## 2. Server Configuration

Server: `http://localhost:8080/api/v1`

Local Spring Boot API Server (Base Context Path: /api/v1)

## 3. Authentication and Security

```yaml
BearerAuth:
  type: http
  scheme: bearer
  bearerFormat: JWT
  description: Nhập Access Token JWT (không cần gõ tiền tố Bearer)
```

Default security requirements:

```yaml
- BearerAuth: []
```

Frontend integration considerations:

- Respect endpoint-specific security requirements.
- Do not expose authentication tokens in logs.
- Treat backend authorization as authoritative.
- Handle expired sessions and rejected requests.
- Do not infer authorization from UI visibility.

## 4. API Module Index

| Module | Operations |
|---|---:|
| 1. Authentication | 7 |
| 2. User & Documents | 10 |
| 3. Cars | 13 |
| 4. Bookings | 11 |
| 5. Payments | 4 |
| 6. Handover | 4 |
| 7. Drivers | 7 |
| 8. Reviews | 9 |
| 9. Disputes | 3 |
| 10. Withdrawals | 3 |
| 11. Admin | 10 |
| 12. AI Chatbot | 3 |
| 13. Notifications | 3 |
| 14. Upload & Excel | 2 |

## 5. Endpoint Directory

| Method | Path | Module | Description |
|---|---|---|---|
| POST | `/auth/register` | 1. Authentication | Đăng ký tài khoản khách thuê hoặc chủ xe (1.1, UC-C01) |
| POST | `/auth/login` | 1. Authentication | Đăng nhập bằng SĐT và mật khẩu (1.2, UC-C02) |
| POST | `/auth/refresh` | 1. Authentication | Cấp lại Access Token mới từ Refresh Token (1.3) |
| POST | `/auth/logout` | 1. Authentication | Đăng xuất và thu hồi session/token (1.4) |
| GET | `/auth/me` | 1. Authentication | Lấy thông tin tài khoản hiện tại (1.5) |
| POST | `/auth/forgot-password` | 1. Authentication | Quên mật khẩu - gửi mã OTP qua SĐT (1.6) |
| POST | `/auth/reset-password` | 1. Authentication | Đặt lại mật khẩu bằng OTP (1.7) |
| PUT | `/users/me` | 2. User & Documents | Cập nhật thông tin cá nhân (2.1) |
| GET | `/users/me` | 2. User & Documents | Lấy thông tin hồ sơ người dùng hiện tại (1.5) |
| POST | `/users/documents/gplx` | 2. User & Documents | Upload Giấy phép lái xe (2.2) |
| POST | `/users/documents/cccd` | 2. User & Documents | Upload Căn cước công dân (2.3) |
| POST | `/users/documents/selfie` | 2. User & Documents | Upload ảnh chân dung selfie (2.4) |
| POST | `/users/submit-verification` | 2. User & Documents | Gửi hồ sơ xác thực (2.5) |
| POST | `/users/change-password` | 2. User & Documents | Đổi mật khẩu tài khoản |
| POST | `/verification/upload` | 2. User & Documents | Upload tài liệu xác minh theo lô (Legacy) |
| POST | `/verification/submit` | 2. User & Documents | Gửi toàn bộ 5 ảnh để Admin phê duyệt (Legacy) |
| GET | `/verification/me` | 2. User & Documents | Xem trạng thái hồ sơ xác thực cá nhân |
| GET | `/cars` | 3. Cars | Tìm kiếm và lọc danh mục xe khả dụng (3.1, UC-C04) |
| POST | `/cars` | 3. Cars | Chủ xe tạo xe mới (3.3, UC-O02) |
| GET | `/cars/my` | 3. Cars | Chủ xe xem danh sách toàn bộ xe của mình (3.10, UC-O02) |
| GET | `/cars/{id}` | 3. Cars | Xem chi tiết xe, thông số kỹ thuật và hình ảnh (3.2, UC-C05) |
| PUT | `/cars/{id}` | 3. Cars | Chủ xe cập nhật thông tin và tiện ích xe (3.4, UC-O02) |
| DELETE | `/cars/{id}` | 3. Cars | Chủ xe xóa hoặc gỡ xe khỏi sàn (3.5, UC-O02) |
| POST | `/cars/{id}/images` | 3. Cars | Upload hình ảnh xe (3.6) |
| POST | `/cars/{id}/documents` | 3. Cars | Upload giấy tờ xe (Đăng ký, Đăng kiểm, Bảo hiểm) (3.7) |
| PUT | `/cars/{id}/pricing` | 3. Cars | Cấu hình bảng giá và phụ phí của xe (3.8, UC-O04) |
| POST | `/cars/{id}/blocked-dates` | 3. Cars | Chủ xe chặn ngày bận / bảo dưỡng của xe (3.9) |
| GET | `/cars/{id}/availability` | 3. Cars | Kiểm tra tính khả dụng của xe theo khoảng thời gian thuê (UC-C04) |
| GET | `/owner/cars` | 3. Cars | Chủ xe xem danh sách toàn bộ xe của mình (Owner UI Dashboard) |
| PATCH | `/owner/cars/{id}/status` | 3. Cars | Chủ xe cập nhật trạng thái xe (AVAILABLE, MAINTENANCE, BROKEN, INACTIVE) |
| POST | `/bookings` | 4. Bookings | Khách hàng tạo đơn đặt xe mới (4.1, UC-C06) |
| GET | `/bookings/my` | 4. Bookings | Khách hàng xem danh sách các chuyến đi của mình (4.2, UC-C08) |
| GET | `/bookings/owner` | 4. Bookings | Chủ xe xem danh sách các đơn đặt xe của đội xe mình (4.3, UC-O05) |
| GET | `/bookings/{id}` | 4. Bookings | Xem chi tiết đơn đặt xe (4.4, UC-C08) |
| POST | `/bookings/{id}/approve` | 4. Bookings | Chủ xe xác nhận duyệt đơn đặt xe (4.4, UC-O06) |
| PUT | `/bookings/{id}/approve` | 4. Bookings | Chủ xe xác nhận duyệt đơn đặt xe (PUT compatibility) |
| POST | `/bookings/{id}/reject` | 4. Bookings | Chủ xe từ chối đơn đặt xe và nêu lý do (4.5, UC-O06) |
| PUT | `/bookings/{id}/reject` | 4. Bookings | Chủ xe từ chối đơn đặt xe (PUT compatibility) |
| POST | `/bookings/{id}/cancel` | 4. Bookings | Hủy đơn đặt xe và tự động tính hoàn cọc theo chính sách (4.6, UC-C11) |
| PUT | `/bookings/{id}/cancel` | 4. Bookings | Hủy đơn đặt xe (PUT compatibility) |
| PUT | `/bookings/{id}/status` | 4. Bookings | Cập nhật trạng thái vòng đời đơn thuê xe (4.7, State Machine) |
| POST | `/payments` | 5. Payments | Tạo thanh toán (5.1, UC-C07) |
| POST | `/payments/callback/{gateway}` | 5. Payments | Callback từ cổng thanh toán (5.2) |
| GET | `/payments/{id}` | 5. Payments | Kiểm tra trạng thái thanh toán (5.3) |
| GET | `/payments/my` | 5. Payments | Lịch sử thanh toán của tôi (5.4) |
| POST | `/handovers/pickup` | 6. Handover | Tạo biên bản giao xe (6.1, UC-C09, UC-O09) |
| POST | `/handovers/return` | 6. Handover | Tạo biên bản nhận xe (6.2, UC-C09, UC-C12, UC-C13, UC-O10) |
| POST | `/handovers/{id}/confirm` | 6. Handover | Xác nhận biên bản giao nhận (6.3) |
| POST | `/drivers` | 7. Drivers | Chủ xe thêm hồ sơ tài xế mới (7.1, UC-O08) |
| GET | `/drivers/my` | 7. Drivers | Chủ xe xem danh sách đội ngũ tài xế của mình (7.2, UC-O08) |
| POST | `/drivers/assign` | 7. Drivers | Chủ xe gán tài xế vào chuyến (7.3) |
| POST | `/drivers/assignments/{id}/accept` | 7. Drivers | Tài xế chấp thuận nhiệm vụ lái chuyến được chỉ định (7.4, UC-D01) |
| POST | `/drivers/assignments/{id}/reject` | 7. Drivers | Tài xế từ chối nhiệm vụ lái chuyến (7.5, UC-D01) |
| POST | `/owner/drivers/import` | 7. Drivers | Chủ xe import danh sách tài xế hàng loạt bằng file Excel (.xlsx) |
| POST | `/owner/drivers/upload-avatar` | 7. Drivers | Chủ xe upload ảnh đại diện tài xế (trả về URL gán vào avatar_url khi tạo / sửa tài xế) |
| POST | `/reviews` | 8. Reviews | Tạo đánh giá chuyến đi (8.1, UC-C10) |
| GET | `/cars/{carId}/reviews` | 8. Reviews | Danh sách đánh giá của xe (8.2, UC-C05) |
| POST | `/reviews/{id}/reply` | 8. Reviews | Chủ xe phản hồi đánh giá (8.3) |
| POST | `/reviews/{id}/customer-reply` | 8. Reviews | Khách trả lời lại phản hồi của chủ xe |
| GET | `/reviews/{id}/replies` | 8. Reviews | Lấy luồng hội thoại khách <-> chủ xe dưới đánh giá |
| POST | `/reviews/{id}/replies` | 8. Reviews | Gửi một tin vào luồng hội thoại (khách hoặc chủ xe, không giới hạn số lượt) |
| GET | `/handovers/fee-config` | 6. Handover | Cấu hình phí vượt km / trả muộn (cho mọi người dùng đã đăng nhập) |
| GET | `/reviews/cars/{carId}` | 8. Reviews | Alias danh sách đánh giá của xe (8.2) |
| GET | `/reviews/my` | 8. Reviews | Danh sách đánh giá của tôi |
| GET | `/reviews/owner/{ownerId}` | 8. Reviews | Xem danh sách đánh giá của chủ xe |
| POST | `/disputes` | 9. Disputes | Khách hàng hoặc Chủ xe tạo khiếu nại tranh chấp chuyến đi (9.1, BR-08) |
| GET | `/disputes/my` | 9. Disputes | Danh sách tranh chấp của tôi (9.2) |
| GET | `/disputes/{id}` | 9. Disputes | Xem diễn biến chi tiết vụ tranh chấp và bằng chứng hai bên (9.2) |
| GET | `/owner/withdrawals` | 10. Withdrawals | Chủ xe xem lịch sử các yêu cầu rút tiền (10.2, BR-10) |
| POST | `/owner/withdrawals` | 10. Withdrawals | Chủ xe tạo lệnh rút tiền từ ví về tài khoản ngân hàng (10.1, BR-10) |
| GET | `/owner/wallet` | 10. Withdrawals | Xem số dư ví chủ xe và lịch sử biến động số dư (10.3) |
| GET | `/admin/dashboard` | 11. Admin | Báo cáo số liệu tổng quan, doanh thu sàn, CSAT và tỷ lệ hủy (11.1, UC-AD-01) |
| GET | `/admin/users` | 11. Admin | Quản lý danh sách người dùng, lọc theo vai trò và trạng thái (11.2, UC-AD-03) |
| PUT | `/admin/users/{id}/verify` | 11. Admin | Admin phê duyệt hồ sơ giấy tờ xác minh của người dùng (11.3, UC-AD-03) |
| PUT | `/admin/users/{id}/reject-verification` | 11. Admin | Admin từ chối hồ sơ giấy tờ và nêu rõ lý do (11.4, UC-AD-03) |
| PUT | `/cars/{id}/approve` | 11. Admin | Admin xét duyệt xe đối tác được phép đăng sàn (11.5, UC-AD-02, BR-03) |
| PUT | `/cars/{id}/reject` | 11. Admin | Admin từ chối xe và gửi lý do cho chủ xe (11.6, UC-AD-02) |
| GET | `/admin/disputes` | 11. Admin | Admin quản lý danh sách tranh chấp (11.4) |
| POST | `/admin/disputes/{id}/resolve` | 11. Admin | Admin phân xử tranh chấp bồi thường (11.5, UC-AD-04) |
| PUT | `/admin/disputes/{id}/resolve` | 11. Admin | Admin ra phán quyết giải quyết vụ tranh chấp bồi thường (Frontend PUT compatibility) |
| PUT | `/admin/withdrawals/{id}/approve` | 11. Admin | Admin phê duyệt lệnh rút tiền và hoàn tất chuyển khoản (11.8, BR-10) |
| POST | `/ai/chat` | 12. AI Chatbot | Hỏi đáp trợ lý AI theo ngữ cảnh vai trò (Guest, Customer, Owner, Admin) (12.1) |
| GET | `/ai/suggestions` | 12. AI Chatbot | Lấy danh sách câu hỏi gợi ý nhanh theo vai trò của người dùng (12.2) |
| GET | `/ai/history` | 12. AI Chatbot | Xem lịch sử hội thoại gần nhất với trợ lý ảo (12.3) |
| GET | `/notifications` | 13. Notifications | Danh sách thông báo (13.1) |
| PUT | `/notifications/{id}/read` | 13. Notifications | Đánh dấu thông báo đã đọc (13.2) |
| PUT | `/notifications/read-all` | 13. Notifications | Đánh dấu tất cả thông báo đã đọc (13.2) |
| POST | `/files/upload` | 14. Upload & Excel | Tải lên hình ảnh xe, tài liệu và chữ ký điện tử (14.1) |
| POST | `/owner/cars/import` | 14. Upload & Excel | Nhập hàng loạt danh sách xe qua file Excel chuẩn 11 cột (14.2) |

## 6. Detailed API Contracts

### 1. Authentication

#### API-001: POST /auth/register

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/auth/register` |
| Module | 1. Authentication |
| Summary | Đăng ký tài khoản khách thuê hoặc chủ xe (1.1, UC-C01) |
| Deprecated | False |

##### Security requirements

No authentication requirement is declared
for this operation in the specification.

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: application/json

Schema: `RegisterRequest`

```yaml
schema:
  $ref: '#/components/schemas/RegisterRequest'
```

Referenced request schema:

```yaml
type: object
required:
- name
- phone
- password
properties:
  name:
    type: string
    example: Nguyễn Văn A
  phone:
    type: string
    example: 0901234567
  password:
    type: string
    example: Pass123@
  email:
    type: string
    example: a@test.com
  role:
    type: string
    enum:
    - customer
    - owner
    default: customer
```

##### Response status codes

| Status | Description |
|---|---|
| `201` | Đăng ký thành công, trả về JWT Token và User DTO |
| `400` | Dữ liệu gửi lên không hợp lệ (Validation Error) |
| `409` | Dữ liệu đã tồn tại (SĐT hoặc Email đã đăng ký) |

##### Response contracts

###### HTTP 201

Đăng ký thành công, trả về JWT Token và User DTO

```yaml
description: Đăng ký thành công, trả về JWT Token và User DTO
content:
  application/json:
    schema:
      $ref: '#/components/schemas/AuthApiResponse'
```

###### HTTP 400

Dữ liệu gửi lên không hợp lệ (Validation Error)

```yaml
description: Dữ liệu gửi lên không hợp lệ (Validation Error)
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiErrorResponse'
```

###### HTTP 409

Dữ liệu đã tồn tại (SĐT hoặc Email đã đăng ký)

```yaml
description: Dữ liệu đã tồn tại (SĐT hoặc Email đã đăng ký)
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiErrorResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-002: POST /auth/login

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/auth/login` |
| Module | 1. Authentication |
| Summary | Đăng nhập bằng SĐT và mật khẩu (1.2, UC-C02) |
| Deprecated | False |

##### Security requirements

No authentication requirement is declared
for this operation in the specification.

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: application/json

Schema: `LoginRequest`

```yaml
schema:
  $ref: '#/components/schemas/LoginRequest'
```

Referenced request schema:

```yaml
type: object
required:
- phone
- password
properties:
  phone:
    type: string
    example: 0901234567
  password:
    type: string
    example: Pass123@
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Đăng nhập thành công, trả về Access Token + Refresh Token |
| `401` | Chưa đăng nhập hoặc Token JWT không hợp lệ |

##### Response contracts

###### HTTP 200

Đăng nhập thành công, trả về Access Token + Refresh Token

```yaml
description: Đăng nhập thành công, trả về Access Token + Refresh Token
content:
  application/json:
    schema:
      $ref: '#/components/schemas/AuthApiResponse'
```

###### HTTP 401

Chưa đăng nhập hoặc Token JWT không hợp lệ

```yaml
description: Chưa đăng nhập hoặc Token JWT không hợp lệ
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiErrorResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-003: POST /auth/refresh

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/auth/refresh` |
| Module | 1. Authentication |
| Summary | Cấp lại Access Token mới từ Refresh Token (1.3) |
| Deprecated | False |

##### Security requirements

No authentication requirement is declared
for this operation in the specification.

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| token | query | False | string | Refresh Token truyền qua query parameter (fallback) |

```yaml
- name: token
  in: query
  required: false
  schema:
    type: string
  description: Refresh Token truyền qua query parameter (fallback)
```

##### Request body

Required: `False`

###### Content type: application/json

Schema: `RefreshTokenRequest`

```yaml
schema:
  $ref: '#/components/schemas/RefreshTokenRequest'
```

Referenced request schema:

```yaml
type: object
properties:
  refresh_token:
    type: string
    example: eyJhbGciOiJIUzI1NiIs...
  refreshToken:
    type: string
    example: eyJhbGciOiJIUzI1NiIs...
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Token đã được làm mới |
| `401` | Chưa đăng nhập hoặc Token JWT không hợp lệ |

##### Response contracts

###### HTTP 200

Token đã được làm mới

```yaml
description: Token đã được làm mới
content:
  application/json:
    schema:
      $ref: '#/components/schemas/AuthApiResponse'
```

###### HTTP 401

Chưa đăng nhập hoặc Token JWT không hợp lệ

```yaml
description: Chưa đăng nhập hoặc Token JWT không hợp lệ
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiErrorResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-004: POST /auth/logout

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/auth/logout` |
| Module | 1. Authentication |
| Summary | Đăng xuất và thu hồi session/token (1.4) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Đăng xuất thành công |

##### Response contracts

###### HTTP 200

Đăng xuất thành công

```yaml
description: Đăng xuất thành công
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiResponseVoid'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-005: GET /auth/me

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/auth/me` |
| Module | 1. Authentication |
| Summary | Lấy thông tin tài khoản hiện tại (1.5) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Thông tin người dùng hiện tại |
| `401` | Chưa đăng nhập hoặc Token JWT không hợp lệ |

##### Response contracts

###### HTTP 200

Thông tin người dùng hiện tại

```yaml
description: Thông tin người dùng hiện tại
content:
  application/json:
    schema:
      $ref: '#/components/schemas/UserApiResponse'
```

###### HTTP 401

Chưa đăng nhập hoặc Token JWT không hợp lệ

```yaml
description: Chưa đăng nhập hoặc Token JWT không hợp lệ
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiErrorResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-006: POST /auth/forgot-password

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/auth/forgot-password` |
| Module | 1. Authentication |
| Summary | Quên mật khẩu - gửi mã OTP qua SĐT (1.6) |
| Deprecated | False |

##### Security requirements

No authentication requirement is declared
for this operation in the specification.

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: application/json

Schema: `ForgotPasswordRequest`

```yaml
schema:
  $ref: '#/components/schemas/ForgotPasswordRequest'
```

Referenced request schema:

```yaml
type: object
required:
- phone
properties:
  phone:
    type: string
    example: 0901234567
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | OTP đã được gửi qua tin nhắn |

##### Response contracts

###### HTTP 200

OTP đã được gửi qua tin nhắn

```yaml
description: OTP đã được gửi qua tin nhắn
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiResponseVoid'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-007: POST /auth/reset-password

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/auth/reset-password` |
| Module | 1. Authentication |
| Summary | Đặt lại mật khẩu bằng OTP (1.7) |
| Deprecated | False |

##### Security requirements

No authentication requirement is declared
for this operation in the specification.

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: application/json

Schema: `ResetPasswordRequest`

```yaml
schema:
  $ref: '#/components/schemas/ResetPasswordRequest'
```

Referenced request schema:

```yaml
type: object
required:
- phone
- otp
- newPassword
properties:
  phone:
    type: string
    example: 0901234567
  otp:
    type: string
    example: '123456'
  new_password:
    type: string
    example: NewPass123@
  newPassword:
    type: string
    example: NewPass123@
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Đặt lại mật khẩu thành công |
| `400` | Dữ liệu gửi lên không hợp lệ (Validation Error) |

##### Response contracts

###### HTTP 200

Đặt lại mật khẩu thành công

```yaml
description: Đặt lại mật khẩu thành công
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiResponseVoid'
```

###### HTTP 400

Dữ liệu gửi lên không hợp lệ (Validation Error)

```yaml
description: Dữ liệu gửi lên không hợp lệ (Validation Error)
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiErrorResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

### 2. User & Documents

#### API-008: PUT /users/me

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `PUT` |
| Endpoint | `/users/me` |
| Module | 2. User & Documents |
| Summary | Cập nhật thông tin cá nhân (2.1) |
| Deprecated | False |

##### Description

Khách hàng hoặc chủ xe cập nhật thông tin họ tên, email, ngày sinh, địa chỉ

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: application/json

Schema: `UpdateProfileRequest`

```yaml
schema:
  $ref: '#/components/schemas/UpdateProfileRequest'
```

Referenced request schema:

```yaml
type: object
required:
- name
properties:
  name:
    type: string
    example: Nguyễn Văn B
  email:
    type: string
    example: b@test.com
  address:
    type: string
    example: 123 Nguyễn Huệ
    Q1: null
    TP.HCM: null
  date_of_birth:
    type: string
    format: date
    example: '1995-01-15'
  dateOfBirth:
    type: string
    format: date
    example: '1995-01-15'
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Cập nhật thành công |

##### Response contracts

###### HTTP 200

Cập nhật thành công

```yaml
description: Cập nhật thành công
content:
  application/json:
    schema:
      $ref: '#/components/schemas/UserApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-009: GET /users/me

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/users/me` |
| Module | 2. User & Documents |
| Summary | Lấy thông tin hồ sơ người dùng hiện tại (1.5) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Hồ sơ người dùng |

##### Response contracts

###### HTTP 200

Hồ sơ người dùng

```yaml
description: Hồ sơ người dùng
content:
  application/json:
    schema:
      $ref: '#/components/schemas/UserApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-010: POST /users/documents/gplx

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/users/documents/gplx` |
| Module | 2. User & Documents |
| Summary | Upload Giấy phép lái xe (2.2) |
| Deprecated | False |

##### Description

Upload 2 mặt GPLX và thông tin số GPLX, hạng bằng lái

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: multipart/form-data

Schema: `object`

```yaml
schema:
  type: object
  required:
  - gplx_front
  - gplx_back
  properties:
    gplx_front:
      type: string
      format: binary
      description: Ảnh mặt trước GPLX
    gplx_back:
      type: string
      format: binary
      description: Ảnh mặt sau GPLX
    gplx_number:
      type: string
      description: Số GPLX
    gplx_class:
      type: string
      description: Hạng bằng lái (B1, B2, C...)
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Upload GPLX thành công |

##### Response contracts

###### HTTP 200

Upload GPLX thành công

```yaml
description: Upload GPLX thành công
content:
  application/json:
    schema:
      $ref: '#/components/schemas/UserDocumentGplxResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-011: POST /users/documents/cccd

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/users/documents/cccd` |
| Module | 2. User & Documents |
| Summary | Upload Căn cước công dân (2.3) |
| Deprecated | False |

##### Description

Upload 2 mặt CCCD và số CCCD

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: multipart/form-data

Schema: `object`

```yaml
schema:
  type: object
  required:
  - cccd_front
  - cccd_back
  properties:
    cccd_front:
      type: string
      format: binary
      description: Ảnh mặt trước CCCD
    cccd_back:
      type: string
      format: binary
      description: Ảnh mặt sau CCCD
    cccd_number:
      type: string
      description: Số CCCD
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Upload CCCD thành công |

##### Response contracts

###### HTTP 200

Upload CCCD thành công

```yaml
description: Upload CCCD thành công
content:
  application/json:
    schema:
      $ref: '#/components/schemas/UserDocumentCccdResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-012: POST /users/documents/selfie

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/users/documents/selfie` |
| Module | 2. User & Documents |
| Summary | Upload ảnh chân dung selfie (2.4) |
| Deprecated | False |

##### Description

Upload ảnh chụp chân dung khuôn mặt đối chiếu với CCCD/GPLX

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: multipart/form-data

Schema: `object`

```yaml
schema:
  type: object
  required:
  - selfie
  properties:
    selfie:
      type: string
      format: binary
      description: Ảnh chân dung selfie
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Upload selfie thành công |

##### Response contracts

###### HTTP 200

Upload selfie thành công

```yaml
description: Upload selfie thành công
content:
  application/json:
    schema:
      $ref: '#/components/schemas/UserDocumentSelfieResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-013: POST /users/submit-verification

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/users/submit-verification` |
| Module | 2. User & Documents |
| Summary | Gửi hồ sơ xác thực (2.5) |
| Deprecated | False |

##### Description

Gửi danh sách ID tài liệu đã upload để Admin phê duyệt xác minh danh tính

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: application/json

Schema: `SubmitVerificationRequest`

```yaml
schema:
  $ref: '#/components/schemas/SubmitVerificationRequest'
```

Referenced request schema:

```yaml
type: object
required:
- gplx_doc_ids
- cccd_doc_ids
- selfie_doc_id
properties:
  gplx_doc_ids:
    type: array
    items:
      type: integer
    example:
    - 1
    - 2
  cccd_doc_ids:
    type: array
    items:
      type: integer
    example:
    - 3
    - 4
  selfie_doc_id:
    type: integer
    example: 5
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Hồ sơ đã được gửi, chờ Admin duyệt |

##### Response contracts

###### HTTP 200

Hồ sơ đã được gửi, chờ Admin duyệt

```yaml
description: Hồ sơ đã được gửi, chờ Admin duyệt
content:
  application/json:
    schema:
      $ref: '#/components/schemas/SubmitVerificationResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-014: POST /users/change-password

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/users/change-password` |
| Module | 2. User & Documents |
| Summary | Đổi mật khẩu tài khoản |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: application/json

Schema: `ChangePasswordRequest`

```yaml
schema:
  $ref: '#/components/schemas/ChangePasswordRequest'
```

Referenced request schema:

```yaml
type: object
required:
- currentPassword
- newPassword
properties:
  current_password:
    type: string
    example: OldPass123@
  currentPassword:
    type: string
    example: OldPass123@
  new_password:
    type: string
    example: NewPass123@
  newPassword:
    type: string
    example: NewPass123@
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Đổi mật khẩu thành công |

##### Response contracts

###### HTTP 200

Đổi mật khẩu thành công

```yaml
description: Đổi mật khẩu thành công
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiResponseVoid'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-015: POST /verification/upload

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/verification/upload` |
| Module | 2. User & Documents |
| Summary | Upload tài liệu xác minh theo lô (Legacy) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: multipart/form-data

Schema: `object`

```yaml
schema:
  type: object
  properties:
    files:
      type: array
      items:
        type: string
        format: binary
    types:
      type: array
      items:
        type: string
        example: GPLX_FRONT
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Upload thành công danh sách ảnh |

##### Response contracts

###### HTTP 200

Upload thành công danh sách ảnh

```yaml
description: Upload thành công danh sách ảnh
content:
  application/json:
    schema:
      $ref: '#/components/schemas/VerificationApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-016: POST /verification/submit

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/verification/submit` |
| Module | 2. User & Documents |
| Summary | Gửi toàn bộ 5 ảnh để Admin phê duyệt (Legacy) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Hồ sơ đã được gửi |

##### Response contracts

###### HTTP 200

Hồ sơ đã được gửi

```yaml
description: Hồ sơ đã được gửi
content:
  application/json:
    schema:
      $ref: '#/components/schemas/VerificationApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-017: GET /verification/me

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/verification/me` |
| Module | 2. User & Documents |
| Summary | Xem trạng thái hồ sơ xác thực cá nhân |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Trạng thái xác minh |

##### Response contracts

###### HTTP 200

Trạng thái xác minh

```yaml
description: Trạng thái xác minh
content:
  application/json:
    schema:
      $ref: '#/components/schemas/VerificationApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

### 3. Cars

#### API-018: GET /cars

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/cars` |
| Module | 3. Cars |
| Summary | Tìm kiếm và lọc danh mục xe khả dụng (3.1, UC-C04) |
| Deprecated | False |

##### Security requirements

No authentication requirement is declared
for this operation in the specification.

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| location | query | False | string |  |
| date_start | query | False | string |  |
| date_end | query | False | string |  |
| rental_type | query | False | string |  |
| brand | query | False | string |  |
| seats | query | False | integer |  |
| transmission | query | False | string |  |
| fuel_type | query | False | string |  |
| min_price | query | False | number |  |
| max_price | query | False | number |  |
| sort | query | False | string |  |
| page | query | False | integer |  |
| limit | query | False | integer |  |

```yaml
- name: location
  in: query
  schema:
    type: string
- name: date_start
  in: query
  schema:
    type: string
    format: date-time
- name: date_end
  in: query
  schema:
    type: string
    format: date-time
- name: rental_type
  in: query
  schema:
    type: string
    enum:
    - SELF_DRIVE
    - WITH_DRIVER
    - BOTH
- name: brand
  in: query
  schema:
    type: string
- name: seats
  in: query
  schema:
    type: integer
- name: transmission
  in: query
  schema:
    type: string
    enum:
    - AUTOMATIC
    - MANUAL
- name: fuel_type
  in: query
  schema:
    type: string
    enum:
    - GASOLINE
    - DIESEL
    - ELECTRIC
- name: min_price
  in: query
  schema:
    type: number
- name: max_price
  in: query
  schema:
    type: number
- name: sort
  in: query
  schema:
    type: string
    default: price_asc
    enum:
    - price_asc
    - price_desc
    - rating_desc
    - newest
- name: page
  in: query
  schema:
    type: integer
    default: 0
- name: limit
  in: query
  schema:
    type: integer
    default: 20
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Danh sách xe tìm kiếm thành công theo Contract |

##### Response contracts

###### HTTP 200

Danh sách xe tìm kiếm thành công theo Contract

```yaml
description: Danh sách xe tìm kiếm thành công theo Contract
content:
  application/json:
    schema:
      $ref: '#/components/schemas/CarPageApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-019: POST /cars

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/cars` |
| Module | 3. Cars |
| Summary | Chủ xe tạo xe mới (3.3, UC-O02) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: application/json

Schema: `CarCreateRequest`

```yaml
schema:
  $ref: '#/components/schemas/CarCreateRequest'
```

Referenced request schema:

```yaml
type: object
required:
- plateNumber
- brand
- model
- seats
- pricePerDay
properties:
  plateNumber:
    type: string
    example: 51A-12345
  brand:
    type: string
    example: Toyota
  model:
    type: string
    example: Camry
  year:
    type: integer
    example: 2023
  seats:
    type: integer
    example: 5
  pricePerDay:
    type: number
    example: 1200000
```

##### Response status codes

| Status | Description |
|---|---|
| `201` | Đăng tải xe thành công, trạng thái PENDING_APPROVAL |

##### Response contracts

###### HTTP 201

Đăng tải xe thành công, trạng thái PENDING_APPROVAL

```yaml
description: Đăng tải xe thành công, trạng thái PENDING_APPROVAL
content:
  application/json:
    schema:
      $ref: '#/components/schemas/CarDetailApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-020: GET /cars/my

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/cars/my` |
| Module | 3. Cars |
| Summary | Chủ xe xem danh sách toàn bộ xe của mình (3.10, UC-O02) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| status | query | False | string |  |
| page | query | False | integer |  |
| limit | query | False | integer |  |

```yaml
- name: status
  in: query
  schema:
    type: string
- name: page
  in: query
  schema:
    type: integer
    default: 0
- name: limit
  in: query
  schema:
    type: integer
    default: 20
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Danh sách xe của chủ xe |

##### Response contracts

###### HTTP 200

Danh sách xe của chủ xe

```yaml
description: Danh sách xe của chủ xe
content:
  application/json:
    schema:
      $ref: '#/components/schemas/CarPageApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-021: GET /cars/{id}

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/cars/{id}` |
| Module | 3. Cars |
| Summary | Xem chi tiết xe, thông số kỹ thuật và hình ảnh (3.2, UC-C05) |
| Deprecated | False |

##### Security requirements

No authentication requirement is declared
for this operation in the specification.

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Chi tiết xe |

##### Response contracts

###### HTTP 200

Chi tiết xe

```yaml
description: Chi tiết xe
content:
  application/json:
    schema:
      $ref: '#/components/schemas/CarDetailApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-022: PUT /cars/{id}

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `PUT` |
| Endpoint | `/cars/{id}` |
| Module | 3. Cars |
| Summary | Chủ xe cập nhật thông tin và tiện ích xe (3.4, UC-O02) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

Required: `True`

###### Content type: application/json

Schema: `CarUpdateRequest`

```yaml
schema:
  $ref: '#/components/schemas/CarUpdateRequest'
```

Referenced request schema:

```yaml
type: object
properties:
  pricePerDay:
    type: number
    example: 1300000
  description:
    type: string
    example: Xe mới bảo dưỡng định kỳ
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Cập nhật xe thành công |

##### Response contracts

###### HTTP 200

Cập nhật xe thành công

```yaml
description: Cập nhật xe thành công
content:
  application/json:
    schema:
      $ref: '#/components/schemas/CarDetailApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-023: DELETE /cars/{id}

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `DELETE` |
| Endpoint | `/cars/{id}` |
| Module | 3. Cars |
| Summary | Chủ xe xóa hoặc gỡ xe khỏi sàn (3.5, UC-O02) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Xóa xe thành công |

##### Response contracts

###### HTTP 200

Xóa xe thành công

```yaml
description: Xóa xe thành công
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiResponseVoid'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-024: POST /cars/{id}/images

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/cars/{id}/images` |
| Module | 3. Cars |
| Summary | Upload hình ảnh xe (3.6) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

Required: `True`

###### Content type: multipart/form-data

Schema: `object`

```yaml
schema:
  type: object
  properties:
    images:
      type: array
      items:
        type: string
        format: binary
    image_types:
      type: array
      items:
        type: string
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Upload ảnh thành công |

##### Response contracts

###### HTTP 200

Upload ảnh thành công

```yaml
description: Upload ảnh thành công
content:
  application/json:
    schema:
      $ref: '#/components/schemas/CarDetailApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-025: POST /cars/{id}/documents

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/cars/{id}/documents` |
| Module | 3. Cars |
| Summary | Upload giấy tờ xe (Đăng ký, Đăng kiểm, Bảo hiểm) (3.7) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

Required: `True`

###### Content type: multipart/form-data

Schema: `object`

```yaml
schema:
  type: object
  properties:
    registration:
      type: string
      format: binary
    inspection:
      type: string
      format: binary
    insurance:
      type: string
      format: binary
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Upload giấy tờ xe thành công |

##### Response contracts

###### HTTP 200

Upload giấy tờ xe thành công

```yaml
description: Upload giấy tờ xe thành công
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiResponseVoid'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-026: PUT /cars/{id}/pricing

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `PUT` |
| Endpoint | `/cars/{id}/pricing` |
| Module | 3. Cars |
| Summary | Cấu hình bảng giá và phụ phí của xe (3.8, UC-O04) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

Required: `True`

###### Content type: application/json

Schema: `CarPricingRequest`

```yaml
schema:
  $ref: '#/components/schemas/CarPricingRequest'
```

Referenced request schema:

```yaml
type: object
properties:
  pricePerDay:
    type: number
    example: 1200000
  priceWeekend:
    type: number
    example: 1400000
  overtimeFeePerHour:
    type: number
    example: 100000
  overKmFee:
    type: number
    example: 5000
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Cấu hình bảng giá thành công |

##### Response contracts

###### HTTP 200

Cấu hình bảng giá thành công

```yaml
description: Cấu hình bảng giá thành công
content:
  application/json:
    schema:
      $ref: '#/components/schemas/CarDetailApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-027: POST /cars/{id}/blocked-dates

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/cars/{id}/blocked-dates` |
| Module | 3. Cars |
| Summary | Chủ xe chặn ngày bận / bảo dưỡng của xe (3.9) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

Required: `True`

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
  required:
  - start_date
  - end_date
  properties:
    start_date:
      type: string
      format: date
    end_date:
      type: string
      format: date
    reason:
      type: string
      example: Bảo dưỡng định kỳ
    note:
      type: string
      example: Thay dầu động cơ
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Chặn ngày thành công |

##### Response contracts

###### HTTP 200

Chặn ngày thành công

```yaml
description: Chặn ngày thành công
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiResponseVoid'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-028: GET /cars/{id}/availability

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/cars/{id}/availability` |
| Module | 3. Cars |
| Summary | Kiểm tra tính khả dụng của xe theo khoảng thời gian thuê (UC-C04) |
| Deprecated | False |

##### Security requirements

No authentication requirement is declared
for this operation in the specification.

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |
| startDate | query | True | string |  |
| endDate | query | True | string |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
- name: startDate
  in: query
  required: true
  schema:
    type: string
    format: date-time
- name: endDate
  in: query
  required: true
  schema:
    type: string
    format: date-time
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Kết quả kiểm tra lịch xe |

##### Response contracts

###### HTTP 200

Kết quả kiểm tra lịch xe

```yaml
description: Kết quả kiểm tra lịch xe
content:
  application/json:
    schema:
      $ref: '#/components/schemas/AvailabilityApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-029: GET /owner/cars

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/owner/cars` |
| Module | 3. Cars |
| Summary | Chủ xe xem danh sách toàn bộ xe của mình (Owner UI Dashboard) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| status | query | False | string |  |
| carType | query | False | string |  |
| search | query | False | string |  |

```yaml
- name: status
  in: query
  schema:
    type: string
- name: carType
  in: query
  schema:
    type: string
- name: search
  in: query
  schema:
    type: string
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Danh sách xe của chủ xe |

##### Response contracts

###### HTTP 200

Danh sách xe của chủ xe

```yaml
description: Danh sách xe của chủ xe
content:
  application/json:
    schema:
      $ref: '#/components/schemas/CarPageApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-030: PATCH /owner/cars/{id}/status

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `PATCH` |
| Endpoint | `/owner/cars/{id}/status` |
| Module | 3. Cars |
| Summary | Chủ xe cập nhật trạng thái xe (AVAILABLE, MAINTENANCE, BROKEN, INACTIVE) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

Required: `True`

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
  required:
  - status
  properties:
    status:
      type: string
      enum:
      - AVAILABLE
      - MAINTENANCE
      - BROKEN
      - INACTIVE
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Trạng thái xe đã được cập nhật |

##### Response contracts

###### HTTP 200

Trạng thái xe đã được cập nhật

```yaml
description: Trạng thái xe đã được cập nhật
content:
  application/json:
    schema:
      $ref: '#/components/schemas/CarDetailApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

### 4. Bookings

#### API-031: POST /bookings

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/bookings` |
| Module | 4. Bookings |
| Summary | Khách hàng tạo đơn đặt xe mới (4.1, UC-C06) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: application/json

Schema: `BookingCreateRequest`

```yaml
schema:
  $ref: '#/components/schemas/BookingCreateRequest'
```

Referenced request schema:

```yaml
type: object
required:
- carId
- startDate
- endDate
properties:
  carId:
    type: integer
    example: 1
  startDate:
    type: string
    format: date-time
    example: '2026-10-15T08:00:00'
  endDate:
    type: string
    format: date-time
    example: '2026-10-18T18:00:00'
  rentalType:
    type: string
    example: SELF_DRIVE
  deliveryAddress:
    type: string
    example: Sân bay Tân Sơn Nhất
```

##### Response status codes

| Status | Description |
|---|---|
| `201` | Đơn đặt xe đã được tạo, tính cọc 30% |

##### Response contracts

###### HTTP 201

Đơn đặt xe đã được tạo, tính cọc 30%

```yaml
description: Đơn đặt xe đã được tạo, tính cọc 30%
content:
  application/json:
    schema:
      $ref: '#/components/schemas/BookingApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-032: GET /bookings/my

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/bookings/my` |
| Module | 4. Bookings |
| Summary | Khách hàng xem danh sách các chuyến đi của mình (4.2, UC-C08) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| status | query | False | string |  |

```yaml
- name: status
  in: query
  schema:
    type: string
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Danh sách đơn đặt xe của khách hàng |

##### Response contracts

###### HTTP 200

Danh sách đơn đặt xe của khách hàng

```yaml
description: Danh sách đơn đặt xe của khách hàng
content:
  application/json:
    schema:
      $ref: '#/components/schemas/BookingListApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-033: GET /bookings/owner

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/bookings/owner` |
| Module | 4. Bookings |
| Summary | Chủ xe xem danh sách các đơn đặt xe của đội xe mình (4.3, UC-O05) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| status | query | False | string |  |

```yaml
- name: status
  in: query
  schema:
    type: string
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Danh sách đơn thuê xe chờ xử lý |

##### Response contracts

###### HTTP 200

Danh sách đơn thuê xe chờ xử lý

```yaml
description: Danh sách đơn thuê xe chờ xử lý
content:
  application/json:
    schema:
      $ref: '#/components/schemas/BookingListApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-034: GET /bookings/{id}

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/bookings/{id}` |
| Module | 4. Bookings |
| Summary | Xem chi tiết đơn đặt xe (4.4, UC-C08) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Chi tiết hợp đồng và lộ trình đơn thuê |

##### Response contracts

###### HTTP 200

Chi tiết hợp đồng và lộ trình đơn thuê

```yaml
description: Chi tiết hợp đồng và lộ trình đơn thuê
content:
  application/json:
    schema:
      $ref: '#/components/schemas/BookingApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-035: POST /bookings/{id}/approve

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/bookings/{id}/approve` |
| Module | 4. Bookings |
| Summary | Chủ xe xác nhận duyệt đơn đặt xe (4.4, UC-O06) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

Required: `False`

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
  properties:
    note:
      type: string
      example: Đã xác nhận, giao xe đúng giờ
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Đơn đặt xe đã được chủ xe chấp thuận |

##### Response contracts

###### HTTP 200

Đơn đặt xe đã được chủ xe chấp thuận

```yaml
description: Đơn đặt xe đã được chủ xe chấp thuận
content:
  application/json:
    schema:
      $ref: '#/components/schemas/BookingApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-036: PUT /bookings/{id}/approve

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `PUT` |
| Endpoint | `/bookings/{id}/approve` |
| Module | 4. Bookings |
| Summary | Chủ xe xác nhận duyệt đơn đặt xe (PUT compatibility) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |
| note | query | False | string |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
- name: note
  in: query
  schema:
    type: string
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Đơn đặt xe đã được chủ xe chấp thuận |

##### Response contracts

###### HTTP 200

Đơn đặt xe đã được chủ xe chấp thuận

```yaml
description: Đơn đặt xe đã được chủ xe chấp thuận
content:
  application/json:
    schema:
      $ref: '#/components/schemas/BookingApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-037: POST /bookings/{id}/reject

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/bookings/{id}/reject` |
| Module | 4. Bookings |
| Summary | Chủ xe từ chối đơn đặt xe và nêu lý do (4.5, UC-O06) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

Required: `False`

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
  properties:
    reason:
      type: string
      example: Xe đang bảo dưỡng đột xuất
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Đơn đặt xe đã bị từ chối, hoàn 100% cọc |

##### Response contracts

###### HTTP 200

Đơn đặt xe đã bị từ chối, hoàn 100% cọc

```yaml
description: Đơn đặt xe đã bị từ chối, hoàn 100% cọc
content:
  application/json:
    schema:
      $ref: '#/components/schemas/BookingApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-038: PUT /bookings/{id}/reject

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `PUT` |
| Endpoint | `/bookings/{id}/reject` |
| Module | 4. Bookings |
| Summary | Chủ xe từ chối đơn đặt xe (PUT compatibility) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |
| reason | query | False | string |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
- name: reason
  in: query
  schema:
    type: string
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Đơn đặt xe đã bị từ chối |

##### Response contracts

###### HTTP 200

Đơn đặt xe đã bị từ chối

```yaml
description: Đơn đặt xe đã bị từ chối
content:
  application/json:
    schema:
      $ref: '#/components/schemas/BookingApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-039: POST /bookings/{id}/cancel

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/bookings/{id}/cancel` |
| Module | 4. Bookings |
| Summary | Hủy đơn đặt xe và tự động tính hoàn cọc theo chính sách (4.6, UC-C11) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

Required: `False`

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
  properties:
    reason:
      type: string
      example: Thay đổi kế hoạch công tác
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Hủy đơn thành công, ghi nhận hoàn cọc |

##### Response contracts

###### HTTP 200

Hủy đơn thành công, ghi nhận hoàn cọc

```yaml
description: Hủy đơn thành công, ghi nhận hoàn cọc
content:
  application/json:
    schema:
      $ref: '#/components/schemas/BookingApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-040: PUT /bookings/{id}/cancel

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `PUT` |
| Endpoint | `/bookings/{id}/cancel` |
| Module | 4. Bookings |
| Summary | Hủy đơn đặt xe (PUT compatibility) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |
| reason | query | False | string |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
- name: reason
  in: query
  schema:
    type: string
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Hủy đơn thành công |

##### Response contracts

###### HTTP 200

Hủy đơn thành công

```yaml
description: Hủy đơn thành công
content:
  application/json:
    schema:
      $ref: '#/components/schemas/BookingApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-041: PUT /bookings/{id}/status

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `PUT` |
| Endpoint | `/bookings/{id}/status` |
| Module | 4. Bookings |
| Summary | Cập nhật trạng thái vòng đời đơn thuê xe (4.7, State Machine) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

Required: `True`

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
  required:
  - status
  properties:
    status:
      type: string
      enum:
      - pending_payment
      - paid_pending_approval
      - approved_pending_pickup
      - in_progress
      - returned_pending_review
      - completed
      - cancelled
      example: in_progress
    note:
      type: string
      example: Đã giao xe cho khách tại địa chỉ hẹn
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Trạng thái đơn được cập nhật thành công |

##### Response contracts

###### HTTP 200

Trạng thái đơn được cập nhật thành công

```yaml
description: Trạng thái đơn được cập nhật thành công
content:
  application/json:
    schema:
      $ref: '#/components/schemas/BookingApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

### 5. Payments

#### API-042: POST /payments

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/payments` |
| Module | 5. Payments |
| Summary | Tạo thanh toán (5.1, UC-C07) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
  required:
  - booking_id
  - payment_type
  - method
  - amount
  properties:
    booking_id:
      type: integer
      example: 100
    payment_type:
      type: string
      example: deposit
    method:
      type: string
      example: momo
    amount:
      type: integer
      example: 1140000
    return_url:
      type: string
      example: https://carrental.com/payment/result
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Khởi tạo thanh toán thành công, trả về Payment URL/QR |

##### Response contracts

###### HTTP 200

Khởi tạo thanh toán thành công, trả về Payment URL/QR

```yaml
description: Khởi tạo thanh toán thành công, trả về Payment URL/QR
content:
  application/json:
    schema:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          properties:
            payment_id:
              type: integer
              example: 200
            transaction_id:
              type: string
              example: PAY-20261001-001
            payment_url:
              type: string
              example: https://payment.momo.vn/pay/...
            qr_code:
              type: string
              example: data:image/png;base64,...
            expires_at:
              type: string
              format: date-time
              example: '2026-10-01T10:15:00Z'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-043: POST /payments/callback/{gateway}

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/payments/callback/{gateway}` |
| Module | 5. Payments |
| Summary | Callback từ cổng thanh toán (5.2) |
| Deprecated | False |

##### Security requirements

No authentication requirement is declared
for this operation in the specification.

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| gateway | path | True | string |  |

```yaml
- name: gateway
  in: path
  required: true
  schema:
    type: string
    example: momo
```

##### Request body

Required: `False`

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Xác nhận đã nhận callback |

##### Response contracts

###### HTTP 200

Xác nhận đã nhận callback

```yaml
description: Xác nhận đã nhận callback
content:
  application/json:
    schema:
      type: object
      properties:
        success:
          type: boolean
          example: true
        message:
          type: string
          example: OK
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-044: GET /payments/{id}

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/payments/{id}` |
| Module | 5. Payments |
| Summary | Kiểm tra trạng thái thanh toán (5.3) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Thông tin thanh toán |

##### Response contracts

###### HTTP 200

Thông tin thanh toán

```yaml
description: Thông tin thanh toán
content:
  application/json:
    schema:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          properties:
            id:
              type: integer
              example: 200
            booking_id:
              type: integer
              example: 100
            transaction_id:
              type: string
              example: PAY-20261001-001
            payment_type:
              type: string
              example: deposit
            method:
              type: string
              example: momo
            amount:
              type: integer
              example: 1140000
            status:
              type: string
              example: success
            paid_at:
              type: string
              format: date-time
              example: '2026-10-01T10:05:00Z'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-045: GET /payments/my

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/payments/my` |
| Module | 5. Payments |
| Summary | Lịch sử thanh toán của tôi (5.4) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| page | query | False | integer |  |
| limit | query | False | integer |  |

```yaml
- name: page
  in: query
  schema:
    type: integer
    default: 1
- name: limit
  in: query
  schema:
    type: integer
    default: 20
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Danh sách lịch sử giao dịch |

##### Response contracts

###### HTTP 200

Danh sách lịch sử giao dịch

```yaml
description: Danh sách lịch sử giao dịch
content:
  application/json:
    schema:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          properties:
            payments:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: integer
                    example: 200
                  booking_id:
                    type: integer
                    example: 100
                  transaction_id:
                    type: string
                    example: PAY-20261001-001
                  amount:
                    type: integer
                    example: 1140000
                  status:
                    type: string
                    example: success
                  created_at:
                    type: string
                    format: date-time
                    example: '2026-10-01T10:00:00Z'
            pagination:
              type: object
              properties:
                page:
                  type: integer
                  example: 1
                limit:
                  type: integer
                  example: 20
                total:
                  type: integer
                  example: 1
                total_pages:
                  type: integer
                  example: 1
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

### 6. Handover

#### API-046: POST /handovers/pickup

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/handovers/pickup` |
| Module | 6. Handover |
| Summary | Tạo biên bản giao xe (6.1, UC-C09, UC-O09) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: multipart/form-data

Schema: `object`

```yaml
schema:
  type: object
  required:
  - booking_id
  - km_reading
  properties:
    booking_id:
      type: integer
      example: 100
    km_reading:
      type: integer
      example: 25000
    fuel_level:
      type: integer
      example: 100
    exterior_note:
      type: string
      example: Không trầy xước
    interior_note:
      type: string
      example: Nội thất sạch sẽ
    damages:
      type: string
      example: '[]'
    images:
      type: array
      items:
        type: string
        format: binary
    signature:
      type: string
      example: data:image/png;base64,...
```

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
  required:
  - booking_id
  - km_reading
  properties:
    booking_id:
      type: integer
      example: 100
    km_reading:
      type: integer
      example: 25000
    fuel_level:
      type: integer
      example: 100
    exterior_note:
      type: string
      example: Không trầy xước
    interior_note:
      type: string
      example: Nội thất sạch sẽ
    damages:
      type: string
      example: '[]'
    signature:
      type: string
      example: data:image/png;base64,...
    image_urls:
      type: array
      items:
        type: string
```

##### Response status codes

| Status | Description |
|---|---|
| `201` | Biên bản giao xe đã được tạo |

##### Response contracts

###### HTTP 201

Biên bản giao xe đã được tạo

```yaml
description: Biên bản giao xe đã được tạo
content:
  application/json:
    schema:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          properties:
            handover_id:
              type: integer
              example: 50
            booking_id:
              type: integer
              example: 100
            handover_type:
              type: string
              example: pickup
            km_reading:
              type: integer
              example: 25000
            owner_signed_at:
              type: string
              format: date-time
              example: '2026-10-15T09:55:00Z'
            record_hash:
              type: string
              example: a3f5b...
            message:
              type: string
              example: Chờ khách xác nhận
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-047: POST /handovers/return

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/handovers/return` |
| Module | 6. Handover |
| Summary | Tạo biên bản nhận xe (6.2, UC-C09, UC-C12, UC-C13, UC-O10) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: multipart/form-data

Schema: `object`

```yaml
schema:
  type: object
  required:
  - booking_id
  - km_reading
  properties:
    booking_id:
      type: integer
      example: 100
    km_reading:
      type: integer
      example: 26200
    fuel_level:
      type: integer
      example: 90
    exterior_note:
      type: string
      example: Trầy nhẹ cản sau
    interior_note:
      type: string
      example: Sạch sẽ
    damages:
      type: string
      example: '[]'
    extra_fees:
      type: number
      example: 1000000
    extra_fees_note:
      type: string
      example: Phí vệ sinh
    images:
      type: array
      items:
        type: string
        format: binary
    signature:
      type: string
      example: data:image/png;base64,...
```

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
  required:
  - booking_id
  - km_reading
  properties:
    booking_id:
      type: integer
      example: 100
    km_reading:
      type: integer
      example: 26200
    fuel_level:
      type: integer
      example: 90
    exterior_note:
      type: string
      example: Trầy nhẹ cản sau
    interior_note:
      type: string
      example: Sạch sẽ
    damages:
      type: string
      example: '[]'
    extra_fees:
      type: number
      example: 1000000
    extra_fees_note:
      type: string
      example: Phí vệ sinh
    signature:
      type: string
      example: data:image/png;base64,...
    image_urls:
      type: array
      items:
        type: string
```

##### Response status codes

| Status | Description |
|---|---|
| `201` | Biên bản nhận xe đã được tạo, tính phụ phí phát sinh |

##### Response contracts

###### HTTP 201

Biên bản nhận xe đã được tạo, tính phụ phí phát sinh

```yaml
description: Biên bản nhận xe đã được tạo, tính phụ phí phát sinh
content:
  application/json:
    schema:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          properties:
            handover_id:
              type: integer
              example: 51
            booking_id:
              type: integer
              example: 100
            handover_type:
              type: string
              example: return
            km_reading:
              type: integer
              example: 26200
            overage_km:
              type: integer
              example: 200
            overage_km_fee:
              type: number
              example: 1000000
            late_fee:
              type: number
              example: 0
            extra_fees:
              type: number
              example: 1000000
            total_extra:
              type: number
              example: 1000000
            record_hash:
              type: string
              example: b7c2d...
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-048: POST /handovers/{id}/confirm

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/handovers/{id}/confirm` |
| Module | 6. Handover |
| Summary | Xác nhận biên bản giao nhận (6.3) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

Required: `True`

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
  required:
  - signature
  properties:
    signature:
      type: string
      example: data:image/png;base64,...
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Đã xác nhận biên bản |

##### Response contracts

###### HTTP 200

Đã xác nhận biên bản

```yaml
description: Đã xác nhận biên bản
content:
  application/json:
    schema:
      type: object
      properties:
        success:
          type: boolean
          example: true
        message:
          type: string
          example: Đã xác nhận biên bản
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-049: GET /handovers/fee-config

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/handovers/fee-config` |
| Module | 6. Handover |
| Summary | Cấu hình phí vượt km / trả muộn (cho mọi người dùng đã đăng nhập) |
| Deprecated | False |

##### Description

Trả các giá trị default_km_per_day, max_km_overage_per_day, max_total_km_overage, km_overage_bracket_1_limit/price, km_overage_bracket_2_limit/price, km_overage_bracket_3_price, late_fee_per_hour mà backend đang dùng để tính phí.

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Map key → value (string) |

##### Response contracts

###### HTTP 200

Map key → value (string)

```yaml
description: Map key → value (string)
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

### 7. Drivers

#### API-050: POST /drivers

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/drivers` |
| Module | 7. Drivers |
| Summary | Chủ xe thêm hồ sơ tài xế mới (7.1, UC-O08) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
  required:
  - name
  - phone
  - cccd_number
  - gplx_number
  - gplx_class
  properties:
    name:
      type: string
      example: Trần Văn Bình
    phone:
      type: string
      example: 0901111111
    cccd_number:
      type: string
      example: 012345678901
    gplx_number:
      type: string
      example: B2-123456
    gplx_class:
      type: string
      example: B2
    gplx_issue_date:
      type: string
      format: date
      example: '2020-01-01'
    gplx_expiry_date:
      type: string
      format: date
      example: '2030-01-01'
    date_of_birth:
      type: string
      format: date
      example: '1990-05-15'
    experience_years:
      type: integer
      example: 5
    vehicle_types:
      type: array
      items:
        type: string
      example:
      - sedan
      - suv
    operating_area:
      type: string
      example: TP.HCM
```

##### Response status codes

| Status | Description |
|---|---|
| `201` | Tài xế đã được tạo, chờ Admin duyệt |

##### Response contracts

###### HTTP 201

Tài xế đã được tạo, chờ Admin duyệt

```yaml
description: Tài xế đã được tạo, chờ Admin duyệt
content:
  application/json:
    schema:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          properties:
            id:
              type: integer
              example: 10
            name:
              type: string
              example: Trần Văn Bình
            status:
              type: string
              example: pending
        message:
          type: string
          example: Tài xế đã được tạo, chờ Admin duyệt
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-051: GET /drivers/my

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/drivers/my` |
| Module | 7. Drivers |
| Summary | Chủ xe xem danh sách đội ngũ tài xế của mình (7.2, UC-O08) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| status | query | False | string |  |
| page | query | False | integer |  |
| limit | query | False | integer |  |
| search | query | False | string |  |

```yaml
- name: status
  in: query
  schema:
    type: string
    example: available
- name: page
  in: query
  schema:
    type: integer
    default: 1
- name: limit
  in: query
  schema:
    type: integer
    default: 20
- name: search
  in: query
  schema:
    type: string
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Danh sách tài xế của chủ xe |

##### Response contracts

###### HTTP 200

Danh sách tài xế của chủ xe

```yaml
description: Danh sách tài xế của chủ xe
content:
  application/json:
    schema:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          properties:
            drivers:
              type: array
              items:
                $ref: '#/components/schemas/DriverDto'
            pagination:
              type: object
              properties:
                page:
                  type: integer
                  example: 1
                limit:
                  type: integer
                  example: 20
                total:
                  type: integer
                  example: 1
                total_pages:
                  type: integer
                  example: 1
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-052: POST /drivers/assign

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/drivers/assign` |
| Module | 7. Drivers |
| Summary | Chủ xe gán tài xế vào chuyến (7.3) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
  required:
  - driver_id
  - booking_id
  properties:
    driver_id:
      type: integer
      example: 10
    booking_id:
      type: integer
      example: 100
    car_id:
      type: integer
      example: 1
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Gán tài xế vào chuyến thành công |

##### Response contracts

###### HTTP 200

Gán tài xế vào chuyến thành công

```yaml
description: Gán tài xế vào chuyến thành công
content:
  application/json:
    schema:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          properties:
            assignment_id:
              type: integer
              example: 30
            driver_id:
              type: integer
              example: 10
            booking_id:
              type: integer
              example: 100
            status:
              type: string
              example: assigned
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-053: POST /drivers/assignments/{id}/accept

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/drivers/assignments/{id}/accept` |
| Module | 7. Drivers |
| Summary | Tài xế chấp thuận nhiệm vụ lái chuyến được chỉ định (7.4, UC-D01) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Tài xế đã nhận nhiệm vụ chuyến đi |

##### Response contracts

###### HTTP 200

Tài xế đã nhận nhiệm vụ chuyến đi

```yaml
description: Tài xế đã nhận nhiệm vụ chuyến đi
content:
  application/json:
    schema:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          properties:
            status:
              type: string
              example: accepted
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-054: POST /drivers/assignments/{id}/reject

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/drivers/assignments/{id}/reject` |
| Module | 7. Drivers |
| Summary | Tài xế từ chối nhiệm vụ lái chuyến (7.5, UC-D01) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

Required: `False`

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
  properties:
    reason:
      type: string
      example: Bận việc đột xuất
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Đã từ chối nhiệm vụ |

##### Response contracts

###### HTTP 200

Đã từ chối nhiệm vụ

```yaml
description: Đã từ chối nhiệm vụ
content:
  application/json:
    schema:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          properties:
            status:
              type: string
              example: rejected
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-055: POST /owner/drivers/import

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/owner/drivers/import` |
| Module | 7. Drivers |
| Summary | Chủ xe import danh sách tài xế hàng loạt bằng file Excel (.xlsx) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: multipart/form-data

Schema: `object`

```yaml
schema:
  type: object
  properties:
    file:
      type: string
      format: binary
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Import hoàn tất |

##### Response contracts

###### HTTP 200

Import hoàn tất

```yaml
description: Import hoàn tất
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiResponseVoid'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-056: POST /owner/drivers/upload-avatar

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/owner/drivers/upload-avatar` |
| Module | 7. Drivers |
| Summary | Chủ xe upload ảnh đại diện tài xế (trả về URL gán vào avatar_url khi tạo / sửa tài xế) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: multipart/form-data

Schema: `object`

```yaml
schema:
  type: object
  required:
  - file
  properties:
    file:
      type: string
      format: binary
      description: Ảnh JPG / PNG / WEBP / GIF, tối đa 5MB (kiểm tra cả Content-Type
        lẫn đuôi file)
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Upload thành công — data là URL ảnh, ví dụ /files/drivers/avatars/5/uuid.jpg |
| `400` | Không phải ảnh hợp lệ / quá 5MB / file rỗng |

##### Response contracts

###### HTTP 200

Upload thành công — data là URL ảnh, ví dụ /files/drivers/avatars/5/uuid.jpg

```yaml
description: Upload thành công — data là URL ảnh, ví dụ /files/drivers/avatars/5/uuid.jpg
```

###### HTTP 400

Không phải ảnh hợp lệ / quá 5MB / file rỗng

```yaml
description: Không phải ảnh hợp lệ / quá 5MB / file rỗng
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

### 8. Reviews

#### API-057: POST /reviews

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/reviews` |
| Module | 8. Reviews |
| Summary | Tạo đánh giá chuyến đi (8.1, UC-C10) |
| Deprecated | False |

##### Description

Khách hàng đánh giá chất lượng xe, chủ xe và tài xế (nếu có) sau khi hoàn tất chuyến đi

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: application/json

Schema: `ReviewCreateRequest`

```yaml
schema:
  $ref: '#/components/schemas/ReviewCreateRequest'
```

Referenced request schema:

```yaml
type: object
required:
- booking_id
- car_rating
- owner_rating
properties:
  booking_id:
    type: integer
    example: 100
  car_rating:
    type: integer
    minimum: 1
    maximum: 5
    example: 5
  owner_rating:
    type: integer
    minimum: 1
    maximum: 5
    example: 5
  driver_rating:
    type: integer
    minimum: 1
    maximum: 5
    nullable: true
    example: 5
  comment:
    type: string
    example: Xe rất tốt, chủ xe thân thiện!
  images:
    type: array
    items:
      type: string
      example: https://example.com/review1.jpg
  is_anonymous:
    type: boolean
    example: false
```

##### Response status codes

| Status | Description |
|---|---|
| `201` | Đã gửi đánh giá thành công |

##### Response contracts

###### HTTP 201

Đã gửi đánh giá thành công

```yaml
description: Đã gửi đánh giá thành công
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ReviewCreateApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-058: GET /cars/{carId}/reviews

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/cars/{carId}/reviews` |
| Module | 8. Reviews |
| Summary | Danh sách đánh giá của xe (8.2, UC-C05) |
| Deprecated | False |

##### Description

Lấy danh sách đánh giá của xe kèm bảng tổng hợp sao và phân trang

##### Security requirements

No authentication requirement is declared
for this operation in the specification.

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| carId | path | True | integer |  |
| page | query | False | integer |  |
| limit | query | False | integer |  |

```yaml
- name: carId
  in: path
  required: true
  schema:
    type: integer
    example: 1
- name: page
  in: query
  schema:
    type: integer
    default: 1
- name: limit
  in: query
  schema:
    type: integer
    default: 10
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Danh sách đánh giá xe và thống kê sao |

##### Response contracts

###### HTTP 200

Danh sách đánh giá xe và thống kê sao

```yaml
description: Danh sách đánh giá xe và thống kê sao
content:
  application/json:
    schema:
      $ref: '#/components/schemas/CarReviewListApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-059: POST /reviews/{id}/reply

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/reviews/{id}/reply` |
| Module | 8. Reviews |
| Summary | Chủ xe phản hồi đánh giá (8.3) |
| Deprecated | False |

##### Description

Chủ xe phản hồi bình luận đánh giá của khách hàng

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
    example: 50
```

##### Request body

Required: `True`

###### Content type: application/json

Schema: `ReviewReplyRequest`

```yaml
schema:
  $ref: '#/components/schemas/ReviewReplyRequest'
```

Referenced request schema:

```yaml
type: object
required:
- reply
properties:
  reply:
    type: string
    example: Cảm ơn bạn đã tin tưởng!
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Đã phản hồi thành công |

##### Response contracts

###### HTTP 200

Đã phản hồi thành công

```yaml
description: Đã phản hồi thành công
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiResponseVoid'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-060: POST /reviews/{id}/customer-reply

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/reviews/{id}/customer-reply` |
| Module | 8. Reviews |
| Summary | Khách trả lời lại phản hồi của chủ xe |
| Deprecated | False |

##### Description

Chỉ khách viết đánh giá được gọi, và chỉ sau khi chủ xe đã phản hồi. Gọi lại sẽ cập nhật câu trả lời. Gửi thông báo REVIEW_REPLY cho chủ xe.

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
    example: 50
```

##### Request body

Required: `True`

###### Content type: application/json

Schema: `ReviewReplyRequest`

```yaml
schema:
  $ref: '#/components/schemas/ReviewReplyRequest'
```

Referenced request schema:

```yaml
type: object
required:
- reply
properties:
  reply:
    type: string
    example: Cảm ơn bạn đã tin tưởng!
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Đã gửi trả lời (trả về đánh giá với customer_reply, customer_replied_at) |
| `400` | Chủ xe chưa phản hồi / nội dung rỗng |
| `403` | Không phải khách của đánh giá này |

##### Response contracts

###### HTTP 200

Đã gửi trả lời (trả về đánh giá với customer_reply, customer_replied_at)

```yaml
description: Đã gửi trả lời (trả về đánh giá với customer_reply, customer_replied_at)
```

###### HTTP 400

Chủ xe chưa phản hồi / nội dung rỗng

```yaml
description: Chủ xe chưa phản hồi / nội dung rỗng
```

###### HTTP 403

Không phải khách của đánh giá này

```yaml
description: Không phải khách của đánh giá này
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-061: GET /reviews/{id}/replies

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/reviews/{id}/replies` |
| Module | 8. Reviews |
| Summary | Lấy luồng hội thoại khách <-> chủ xe dưới đánh giá |
| Deprecated | False |

##### Description

Gồm owner_reply / customer_reply cũ (legacy = true) và các tin trong review_replies, sắp theo thời gian tăng dần. Mỗi ReviewResponse cũng có sẵn trường replies.

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
    example: 50
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Danh sách tin (id, review_id, author_id, author_role OWNER\|CUSTOMER, author_name, content, legacy, created_at) |
| `404` | Không tìm thấy đánh giá |

##### Response contracts

###### HTTP 200

Danh sách tin (id, review_id, author_id, author_role OWNER|CUSTOMER, author_name, content, legacy, created_at)

```yaml
description: Danh sách tin (id, review_id, author_id, author_role OWNER|CUSTOMER,
  author_name, content, legacy, created_at)
```

###### HTTP 404

Không tìm thấy đánh giá

```yaml
description: Không tìm thấy đánh giá
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-062: POST /reviews/{id}/replies

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/reviews/{id}/replies` |
| Module | 8. Reviews |
| Summary | Gửi một tin vào luồng hội thoại (khách hoặc chủ xe, không giới hạn số lượt) |
| Deprecated | False |

##### Description

Chỉ khách viết đánh giá hoặc chủ xe được gọi. Khách chỉ gửi được sau khi chủ xe đã phản hồi ít nhất một lần. Gửi thông báo REVIEW_REPLY cho bên còn lại. Trả về toàn bộ luồng mới.

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
    example: 50
```

##### Request body

Required: `True`

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
  required:
  - content
  properties:
    content:
      type: string
      maxLength: 1000
      example: Cảm ơn bạn, lần sau mình sẽ kiểm tra kỹ hơn!
```

##### Response status codes

| Status | Description |
|---|---|
| `201` | Đã gửi — trả về luồng hội thoại đầy đủ |
| `400` | Nội dung rỗng / quá 1000 ký tự / khách gửi khi chủ xe chưa phản hồi |
| `403` | Không phải khách hoặc chủ xe của đánh giá này |

##### Response contracts

###### HTTP 201

Đã gửi — trả về luồng hội thoại đầy đủ

```yaml
description: Đã gửi — trả về luồng hội thoại đầy đủ
```

###### HTTP 400

Nội dung rỗng / quá 1000 ký tự / khách gửi khi chủ xe chưa phản hồi

```yaml
description: Nội dung rỗng / quá 1000 ký tự / khách gửi khi chủ xe chưa phản hồi
```

###### HTTP 403

Không phải khách hoặc chủ xe của đánh giá này

```yaml
description: Không phải khách hoặc chủ xe của đánh giá này
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-063: GET /reviews/cars/{carId}

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/reviews/cars/{carId}` |
| Module | 8. Reviews |
| Summary | Alias danh sách đánh giá của xe (8.2) |
| Deprecated | False |

##### Security requirements

No authentication requirement is declared
for this operation in the specification.

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| carId | path | True | integer |  |
| page | query | False | integer |  |
| limit | query | False | integer |  |

```yaml
- name: carId
  in: path
  required: true
  schema:
    type: integer
- name: page
  in: query
  schema:
    type: integer
    default: 1
- name: limit
  in: query
  schema:
    type: integer
    default: 10
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Danh sách đánh giá xe |

##### Response contracts

###### HTTP 200

Danh sách đánh giá xe

```yaml
description: Danh sách đánh giá xe
content:
  application/json:
    schema:
      $ref: '#/components/schemas/CarReviewListApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-064: GET /reviews/my

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/reviews/my` |
| Module | 8. Reviews |
| Summary | Danh sách đánh giá của tôi |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Danh sách đánh giá của tôi |

##### Response contracts

###### HTTP 200

Danh sách đánh giá của tôi

```yaml
description: Danh sách đánh giá của tôi
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ReviewListApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-065: GET /reviews/owner/{ownerId}

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/reviews/owner/{ownerId}` |
| Module | 8. Reviews |
| Summary | Xem danh sách đánh giá của chủ xe |
| Deprecated | False |

##### Security requirements

No authentication requirement is declared
for this operation in the specification.

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| ownerId | path | True | integer |  |

```yaml
- name: ownerId
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Danh sách đánh giá chủ xe |

##### Response contracts

###### HTTP 200

Danh sách đánh giá chủ xe

```yaml
description: Danh sách đánh giá chủ xe
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ReviewListApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

### 9. Disputes

#### API-066: POST /disputes

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/disputes` |
| Module | 9. Disputes |
| Summary | Khách hàng hoặc Chủ xe tạo khiếu nại tranh chấp chuyến đi (9.1, BR-08) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: multipart/form-data

Schema: `object`

```yaml
schema:
  type: object
  required:
  - booking_id
  - category
  - description
  properties:
    booking_id:
      type: integer
      example: 10
    against_user_id:
      type: integer
      example: 5
    category:
      type: string
      example: damage
    description:
      type: string
      example: Xe bị trầy xước cản trước khi nhận lại xe
    claimed_amount:
      type: number
      example: 2000000
    evidence:
      type: array
      items:
        type: string
        format: binary
```

###### Content type: application/json

Schema: `DisputeCreateRequest`

```yaml
schema:
  $ref: '#/components/schemas/DisputeCreateRequest'
```

Referenced request schema:

```yaml
type: object
required:
- bookingId
- reason
- claimAmount
properties:
  bookingId:
    type: integer
    example: 101
  reason:
    type: string
    example: Xe bị hỏng điều hòa giữa đường
  claimAmount:
    type: number
    example: 500000
  evidenceImages:
    type: array
    items:
      type: string
```

##### Response status codes

| Status | Description |
|---|---|
| `201` | Khiếu nại đã được ghi nhận, deadline phản hồi 48h |

##### Response contracts

###### HTTP 201

Khiếu nại đã được ghi nhận, deadline phản hồi 48h

```yaml
description: Khiếu nại đã được ghi nhận, deadline phản hồi 48h
content:
  application/json:
    schema:
      $ref: '#/components/schemas/DisputeApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-067: GET /disputes/my

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/disputes/my` |
| Module | 9. Disputes |
| Summary | Danh sách tranh chấp của tôi (9.2) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| status | query | False | string |  |
| page | query | False | integer |  |
| limit | query | False | integer |  |

```yaml
- name: status
  in: query
  schema:
    type: string
    example: pending
- name: page
  in: query
  schema:
    type: integer
    default: 1
- name: limit
  in: query
  schema:
    type: integer
    default: 10
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Danh sách tranh chấp của người dùng |

##### Response contracts

###### HTTP 200

Danh sách tranh chấp của người dùng

```yaml
description: Danh sách tranh chấp của người dùng
content:
  application/json:
    schema:
      $ref: '#/components/schemas/DisputeListApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-068: GET /disputes/{id}

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/disputes/{id}` |
| Module | 9. Disputes |
| Summary | Xem diễn biến chi tiết vụ tranh chấp và bằng chứng hai bên (9.2) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Chi tiết hồ sơ khiếu nại |

##### Response contracts

###### HTTP 200

Chi tiết hồ sơ khiếu nại

```yaml
description: Chi tiết hồ sơ khiếu nại
content:
  application/json:
    schema:
      $ref: '#/components/schemas/DisputeApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

### 10. Withdrawals

#### API-069: GET /owner/withdrawals

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/owner/withdrawals` |
| Module | 10. Withdrawals |
| Summary | Chủ xe xem lịch sử các yêu cầu rút tiền (10.2, BR-10) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Lịch sử yêu cầu rút tiền |

##### Response contracts

###### HTTP 200

Lịch sử yêu cầu rút tiền

```yaml
description: Lịch sử yêu cầu rút tiền
content:
  application/json:
    schema:
      $ref: '#/components/schemas/WithdrawalListApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-070: POST /owner/withdrawals

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/owner/withdrawals` |
| Module | 10. Withdrawals |
| Summary | Chủ xe tạo lệnh rút tiền từ ví về tài khoản ngân hàng (10.1, BR-10) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: application/json

Schema: `WithdrawalCreateRequest`

```yaml
schema:
  $ref: '#/components/schemas/WithdrawalCreateRequest'
```

Referenced request schema:

```yaml
type: object
required:
- amount
- bankName
- accountNumber
- accountName
properties:
  amount:
    type: number
    example: 5000000
  bankName:
    type: string
    example: Vietcombank
  accountNumber:
    type: string
    example: '0071001234567'
  accountName:
    type: string
    example: NGUYEN VAN A
```

##### Response status codes

| Status | Description |
|---|---|
| `201` | Lệnh rút tiền đã được tạo, tiền đã phong tỏa chờ duyệt |

##### Response contracts

###### HTTP 201

Lệnh rút tiền đã được tạo, tiền đã phong tỏa chờ duyệt

```yaml
description: Lệnh rút tiền đã được tạo, tiền đã phong tỏa chờ duyệt
content:
  application/json:
    schema:
      $ref: '#/components/schemas/WithdrawalApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-071: GET /owner/wallet

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/owner/wallet` |
| Module | 10. Withdrawals |
| Summary | Xem số dư ví chủ xe và lịch sử biến động số dư (10.3) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Thông tin ví và số dư khả dụng |

##### Response contracts

###### HTTP 200

Thông tin ví và số dư khả dụng

```yaml
description: Thông tin ví và số dư khả dụng
content:
  application/json:
    schema:
      $ref: '#/components/schemas/WalletApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

### 11. Admin

#### API-072: GET /admin/dashboard

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/admin/dashboard` |
| Module | 11. Admin |
| Summary | Báo cáo số liệu tổng quan, doanh thu sàn, CSAT và tỷ lệ hủy (11.1, UC-AD-01) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Thống kê KPI hệ thống |

##### Response contracts

###### HTTP 200

Thống kê KPI hệ thống

```yaml
description: Thống kê KPI hệ thống
content:
  application/json:
    schema:
      $ref: '#/components/schemas/AdminDashboardApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-073: GET /admin/users

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/admin/users` |
| Module | 11. Admin |
| Summary | Quản lý danh sách người dùng, lọc theo vai trò và trạng thái (11.2, UC-AD-03) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| role | query | False | string |  |
| status | query | False | string |  |

```yaml
- name: role
  in: query
  schema:
    type: string
- name: status
  in: query
  schema:
    type: string
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Danh sách người dùng |

##### Response contracts

###### HTTP 200

Danh sách người dùng

```yaml
description: Danh sách người dùng
content:
  application/json:
    schema:
      $ref: '#/components/schemas/AdminUserListApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-074: PUT /admin/users/{id}/verify

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `PUT` |
| Endpoint | `/admin/users/{id}/verify` |
| Module | 11. Admin |
| Summary | Admin phê duyệt hồ sơ giấy tờ xác minh của người dùng (11.3, UC-AD-03) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Đã xác thực thành công người dùng |

##### Response contracts

###### HTTP 200

Đã xác thực thành công người dùng

```yaml
description: Đã xác thực thành công người dùng
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiResponseVoid'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-075: PUT /admin/users/{id}/reject-verification

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `PUT` |
| Endpoint | `/admin/users/{id}/reject-verification` |
| Module | 11. Admin |
| Summary | Admin từ chối hồ sơ giấy tờ và nêu rõ lý do (11.4, UC-AD-03) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

Required: `True`

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
  required:
  - reason
  properties:
    reason:
      type: string
      example: Ảnh chụp GPLX bị mờ
      lóa đèn: null
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Đã từ chối hồ sơ |

##### Response contracts

###### HTTP 200

Đã từ chối hồ sơ

```yaml
description: Đã từ chối hồ sơ
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiResponseVoid'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-076: PUT /cars/{id}/approve

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `PUT` |
| Endpoint | `/cars/{id}/approve` |
| Module | 11. Admin |
| Summary | Admin xét duyệt xe đối tác được phép đăng sàn (11.5, UC-AD-02, BR-03) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Xe chuyển sang trạng thái AVAILABLE |

##### Response contracts

###### HTTP 200

Xe chuyển sang trạng thái AVAILABLE

```yaml
description: Xe chuyển sang trạng thái AVAILABLE
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiResponseVoid'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-077: PUT /cars/{id}/reject

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `PUT` |
| Endpoint | `/cars/{id}/reject` |
| Module | 11. Admin |
| Summary | Admin từ chối xe và gửi lý do cho chủ xe (11.6, UC-AD-02) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

Required: `False`

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
  properties:
    reason:
      type: string
      example: Đăng kiểm xe đã hết hạn
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Đã từ chối duyệt xe |

##### Response contracts

###### HTTP 200

Đã từ chối duyệt xe

```yaml
description: Đã từ chối duyệt xe
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiResponseVoid'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-078: GET /admin/disputes

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/admin/disputes` |
| Module | 11. Admin |
| Summary | Admin quản lý danh sách tranh chấp (11.4) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| status | query | False | string |  |
| page | query | False | integer |  |
| limit | query | False | integer |  |

```yaml
- name: status
  in: query
  schema:
    type: string
    example: pending
- name: page
  in: query
  schema:
    type: integer
    default: 1
- name: limit
  in: query
  schema:
    type: integer
    default: 20
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Danh sách tranh chấp |

##### Response contracts

###### HTTP 200

Danh sách tranh chấp

```yaml
description: Danh sách tranh chấp
content:
  application/json:
    schema:
      $ref: '#/components/schemas/DisputeListApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-079: POST /admin/disputes/{id}/resolve

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/admin/disputes/{id}/resolve` |
| Module | 11. Admin |
| Summary | Admin phân xử tranh chấp bồi thường (11.5, UC-AD-04) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

Required: `True`

###### Content type: application/json

Schema: `object`

```yaml
schema:
  type: object
  required:
  - resolution
  properties:
    resolution:
      type: string
      enum:
      - customer_wins
      - owner_wins
      - split
      - insufficient_evidence
      example: customer_wins
    resolved_amount:
      type: number
      example: 2000000
    note:
      type: string
      example: Khách hàng có bằng chứng đầy đủ
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Phán quyết đã được thi hành |

##### Response contracts

###### HTTP 200

Phán quyết đã được thi hành

```yaml
description: Phán quyết đã được thi hành
content:
  application/json:
    schema:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          properties:
            status:
              type: string
              example: resolved
            resolved_amount:
              type: number
              example: 2000000
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-080: PUT /admin/disputes/{id}/resolve

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `PUT` |
| Endpoint | `/admin/disputes/{id}/resolve` |
| Module | 11. Admin |
| Summary | Admin ra phán quyết giải quyết vụ tranh chấp bồi thường (Frontend PUT compatibility) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

Required: `True`

###### Content type: application/json

Schema: `DisputeResolveRequest`

```yaml
schema:
  $ref: '#/components/schemas/DisputeResolveRequest'
```

Referenced request schema:

```yaml
type: object
required:
- resolution
- refundAmount
properties:
  resolution:
    type: string
    example: Đồng ý hoàn lại 50% tiền cọc cho khách
  refundAmount:
    type: number
    example: 500000
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Phán quyết đã được thi hành |

##### Response contracts

###### HTTP 200

Phán quyết đã được thi hành

```yaml
description: Phán quyết đã được thi hành
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiResponseVoid'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-081: PUT /admin/withdrawals/{id}/approve

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `PUT` |
| Endpoint | `/admin/withdrawals/{id}/approve` |
| Module | 11. Admin |
| Summary | Admin phê duyệt lệnh rút tiền và hoàn tất chuyển khoản (11.8, BR-10) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Lệnh rút tiền đã hoàn thành |

##### Response contracts

###### HTTP 200

Lệnh rút tiền đã hoàn thành

```yaml
description: Lệnh rút tiền đã hoàn thành
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiResponseVoid'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

### 12. AI Chatbot

#### API-082: POST /ai/chat

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/ai/chat` |
| Module | 12. AI Chatbot |
| Summary | Hỏi đáp trợ lý AI theo ngữ cảnh vai trò (Guest, Customer, Owner, Admin) (12.1) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: application/json

Schema: `AIChatRequest`

```yaml
schema:
  $ref: '#/components/schemas/AIChatRequest'
```

Referenced request schema:

```yaml
type: object
required:
- message
properties:
  message:
    type: string
    example: Tôi muốn tìm xe 7 chỗ đi Vũng Tàu
  role:
    type: string
    example: CUSTOMER
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Phản hồi thông minh kèm gợi ý hành động tiếp theo |

##### Response contracts

###### HTTP 200

Phản hồi thông minh kèm gợi ý hành động tiếp theo

```yaml
description: Phản hồi thông minh kèm gợi ý hành động tiếp theo
content:
  application/json:
    schema:
      $ref: '#/components/schemas/AIChatApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-083: GET /ai/suggestions

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/ai/suggestions` |
| Module | 12. AI Chatbot |
| Summary | Lấy danh sách câu hỏi gợi ý nhanh theo vai trò của người dùng (12.2) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Danh sách gợi ý câu hỏi |

##### Response contracts

###### HTTP 200

Danh sách gợi ý câu hỏi

```yaml
description: Danh sách gợi ý câu hỏi
content:
  application/json:
    schema:
      $ref: '#/components/schemas/AISuggestionsApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-084: GET /ai/history

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/ai/history` |
| Module | 12. AI Chatbot |
| Summary | Xem lịch sử hội thoại gần nhất với trợ lý ảo (12.3) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Lịch sử tin nhắn |

##### Response contracts

###### HTTP 200

Lịch sử tin nhắn

```yaml
description: Lịch sử tin nhắn
content:
  application/json:
    schema:
      $ref: '#/components/schemas/AIChatHistoryApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

### 13. Notifications

#### API-085: GET /notifications

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `GET` |
| Endpoint | `/notifications` |
| Module | 13. Notifications |
| Summary | Danh sách thông báo (13.1) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| unread_only | query | False | boolean |  |
| page | query | False | integer |  |
| limit | query | False | integer |  |
| type | query | False | string |  |

```yaml
- name: unread_only
  in: query
  schema:
    type: boolean
    example: true
- name: page
  in: query
  schema:
    type: integer
    default: 1
- name: limit
  in: query
  schema:
    type: integer
    default: 20
- name: type
  in: query
  schema:
    type: string
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Danh sách thông báo |

##### Response contracts

###### HTTP 200

Danh sách thông báo

```yaml
description: Danh sách thông báo
content:
  application/json:
    schema:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          properties:
            notifications:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: integer
                    example: 1
                  type:
                    type: string
                    example: booking_approved
                  title:
                    type: string
                    example: Đơn đặt xe đã được duyệt
                  message:
                    type: string
                    example: Đơn CR-2026-1001 của bạn đã được chủ xe xác nhận
                  link:
                    type: string
                    example: /bookings/100
                  is_read:
                    type: boolean
                    example: false
                  created_at:
                    type: string
                    format: date-time
                    example: '2026-10-01T10:30:00Z'
            unread_count:
              type: integer
              example: 5
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.

Verification status: Not executed.

---

#### API-086: PUT /notifications/{id}/read

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `PUT` |
| Endpoint | `/notifications/{id}/read` |
| Module | 13. Notifications |
| Summary | Đánh dấu thông báo đã đọc (13.2) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

| Name | Location | Required | Type | Description |
|---|---|---|---|---|
| id | path | True | integer |  |

```yaml
- name: id
  in: path
  required: true
  schema:
    type: integer
```

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Đã đánh dấu đã đọc |

##### Response contracts

###### HTTP 200

Đã đánh dấu đã đọc

```yaml
description: Đã đánh dấu đã đọc
content:
  application/json:
    schema:
      type: object
      properties:
        success:
          type: boolean
          example: true
        message:
          type: string
          example: Đã đánh dấu đã đọc
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-087: PUT /notifications/read-all

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `PUT` |
| Endpoint | `/notifications/read-all` |
| Module | 13. Notifications |
| Summary | Đánh dấu tất cả thông báo đã đọc (13.2) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

No request body declared.

##### Response status codes

| Status | Description |
|---|---|
| `200` | Đã đánh dấu đã đọc |

##### Response contracts

###### HTTP 200

Đã đánh dấu đã đọc

```yaml
description: Đã đánh dấu đã đọc
content:
  application/json:
    schema:
      type: object
      properties:
        success:
          type: boolean
          example: true
        message:
          type: string
          example: Đã đánh dấu đã đọc
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

### 14. Upload & Excel

#### API-088: POST /files/upload

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/files/upload` |
| Module | 14. Upload & Excel |
| Summary | Tải lên hình ảnh xe, tài liệu và chữ ký điện tử (14.1) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: multipart/form-data

Schema: `object`

```yaml
schema:
  type: object
  required:
  - file
  properties:
    file:
      type: string
      format: binary
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | File đã tải lên thành công, trả về URL truy cập |

##### Response contracts

###### HTTP 200

File đã tải lên thành công, trả về URL truy cập

```yaml
description: File đã tải lên thành công, trả về URL truy cập
content:
  application/json:
    schema:
      $ref: '#/components/schemas/FileUploadApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

#### API-089: POST /owner/cars/import

##### Operation metadata

| Attribute | Value |
|---|---|
| Method | `POST` |
| Endpoint | `/owner/cars/import` |
| Module | 14. Upload & Excel |
| Summary | Nhập hàng loạt danh sách xe qua file Excel chuẩn 11 cột (14.2) |
| Deprecated | False |

##### Security requirements

```yaml
- BearerAuth: []
```

##### Request parameters

No parameters declared.

##### Request body

Required: `True`

###### Content type: multipart/form-data

Schema: `object`

```yaml
schema:
  type: object
  required:
  - file
  properties:
    file:
      type: string
      format: binary
```

##### Response status codes

| Status | Description |
|---|---|
| `200` | Kết quả import xe, số dòng hợp lệ và chi tiết lỗi nếu có |

##### Response contracts

###### HTTP 200

Kết quả import xe, số dòng hợp lệ và chi tiết lỗi nếu có

```yaml
description: Kết quả import xe, số dòng hợp lệ và chi tiết lỗi nếu có
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ExcelImportApiResponse'
```

##### Frontend integration checklist

- Use the declared HTTP method.
- Use the correct endpoint and base URL.
- Supply declared required parameters.
- Respect the authentication requirements.
- Validate request data against the request schema.
- Use the declared request content type.
- Handle the documented response status codes.
- Parse response data according to its declared schema.
- Prevent unintended repeated submissions.
- Refresh affected UI state after confirmed success.

Verification status: Not executed.

---

## 7. Data Schema Reference

### ApiResponseVoid

Reference: `#/components/schemas/ApiResponseVoid`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `code` | integer | No |  |
| `message` | string | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  code:
    type: integer
    example: 0
  message:
    type: string
    example: Thao tác thành công
```

### ApiErrorResponse

Reference: `#/components/schemas/ApiErrorResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `code` | integer | No |  |
| `message` | string | No |  |
| `timestamp` | string | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: false
  code:
    type: integer
    example: 400
  message:
    type: string
    example: Dữ liệu không hợp lệ
  timestamp:
    type: string
    example: '2026-10-10T14:30:00'
```

### RegisterRequest

Reference: `#/components/schemas/RegisterRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes |  |
| `phone` | string | Yes |  |
| `password` | string | Yes |  |
| `email` | string | No |  |
| `role` | string | No |  |

#### Schema definition

```yaml
type: object
required:
- name
- phone
- password
properties:
  name:
    type: string
    example: Nguyễn Văn A
  phone:
    type: string
    example: 0901234567
  password:
    type: string
    example: Pass123@
  email:
    type: string
    example: a@test.com
  role:
    type: string
    enum:
    - customer
    - owner
    default: customer
```

### LoginRequest

Reference: `#/components/schemas/LoginRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `phone` | string | Yes |  |
| `password` | string | Yes |  |

#### Schema definition

```yaml
type: object
required:
- phone
- password
properties:
  phone:
    type: string
    example: 0901234567
  password:
    type: string
    example: Pass123@
```

### RefreshTokenRequest

Reference: `#/components/schemas/RefreshTokenRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `refresh_token` | string | No |  |
| `refreshToken` | string | No |  |

#### Schema definition

```yaml
type: object
properties:
  refresh_token:
    type: string
    example: eyJhbGciOiJIUzI1NiIs...
  refreshToken:
    type: string
    example: eyJhbGciOiJIUzI1NiIs...
```

### ForgotPasswordRequest

Reference: `#/components/schemas/ForgotPasswordRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `phone` | string | Yes |  |

#### Schema definition

```yaml
type: object
required:
- phone
properties:
  phone:
    type: string
    example: 0901234567
```

### ResetPasswordRequest

Reference: `#/components/schemas/ResetPasswordRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `phone` | string | Yes |  |
| `otp` | string | Yes |  |
| `new_password` | string | No |  |
| `newPassword` | string | Yes |  |

#### Schema definition

```yaml
type: object
required:
- phone
- otp
- newPassword
properties:
  phone:
    type: string
    example: 0901234567
  otp:
    type: string
    example: '123456'
  new_password:
    type: string
    example: NewPass123@
  newPassword:
    type: string
    example: NewPass123@
```

### UpdateProfileRequest

Reference: `#/components/schemas/UpdateProfileRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes |  |
| `email` | string | No |  |
| `address` | string | No |  |
| `date_of_birth` | string | No |  |
| `dateOfBirth` | string | No |  |

#### Schema definition

```yaml
type: object
required:
- name
properties:
  name:
    type: string
    example: Nguyễn Văn B
  email:
    type: string
    example: b@test.com
  address:
    type: string
    example: 123 Nguyễn Huệ
    Q1: null
    TP.HCM: null
  date_of_birth:
    type: string
    format: date
    example: '1995-01-15'
  dateOfBirth:
    type: string
    format: date
    example: '1995-01-15'
```

### ChangePasswordRequest

Reference: `#/components/schemas/ChangePasswordRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `current_password` | string | No |  |
| `currentPassword` | string | Yes |  |
| `new_password` | string | No |  |
| `newPassword` | string | Yes |  |

#### Schema definition

```yaml
type: object
required:
- currentPassword
- newPassword
properties:
  current_password:
    type: string
    example: OldPass123@
  currentPassword:
    type: string
    example: OldPass123@
  new_password:
    type: string
    example: NewPass123@
  newPassword:
    type: string
    example: NewPass123@
```

### AuthResponseData

Reference: `#/components/schemas/AuthResponseData`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `user_id` | integer | No |  |
| `name` | string | No |  |
| `phone` | string | No |  |
| `role` | string | No |  |
| `token` | string | No |  |
| `accessToken` | string | No |  |
| `refresh_token` | string | No |  |
| `user` | UserDto | No |  |

#### Schema definition

```yaml
type: object
properties:
  user_id:
    type: integer
    example: 123
  name:
    type: string
    example: Nguyễn Văn A
  phone:
    type: string
    example: 0901234567
  role:
    type: string
    example: customer
  token:
    type: string
    example: eyJhbGciOiJIUzI1NiIs...
  accessToken:
    type: string
    example: eyJhbGciOiJIUzI1NiIs...
  refresh_token:
    type: string
    example: eyJhbGciOiJIUzI1NiIs...
  user:
    $ref: '#/components/schemas/UserDto'
```

### AuthApiResponse

Reference: `#/components/schemas/AuthApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `code` | integer | No |  |
| `message` | string | No |  |
| `data` | AuthResponseData | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  code:
    type: integer
    example: 0
  message:
    type: string
    example: Đăng nhập thành công
  data:
    $ref: '#/components/schemas/AuthResponseData'
```

### UserDto

Reference: `#/components/schemas/UserDto`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No |  |
| `name` | string | No |  |
| `phone` | string | No |  |
| `email` | string | No |  |
| `role` | string | No |  |
| `verificationStatus` | string | No |  |
| `verification_status` | string | No |  |
| `avatar_url` | string | No |  |
| `address` | string | No |  |
| `date_of_birth` | string | No |  |
| `created_at` | string | No |  |

#### Schema definition

```yaml
type: object
properties:
  id:
    type: integer
    example: 123
  name:
    type: string
    example: Nguyễn Văn A
  phone:
    type: string
    example: 0901234567
  email:
    type: string
    example: a@test.com
  role:
    type: string
    example: CUSTOMER
  verificationStatus:
    type: string
    example: VERIFIED
  verification_status:
    type: string
    example: verified
  avatar_url:
    type: string
    example: https://uploads.vn/avatars/u123.jpg
  address:
    type: string
    example: 123 Nguyễn Huệ
    TP.HCM: null
  date_of_birth:
    type: string
    example: '1995-01-15'
  created_at:
    type: string
    example: '2026-09-01T10:00:00'
```

### UserApiResponse

Reference: `#/components/schemas/UserApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | UserDto | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    $ref: '#/components/schemas/UserDto'
```

### VerificationApiResponse

Reference: `#/components/schemas/VerificationApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `message` | string | No |  |
| `data` | object | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  message:
    type: string
    example: Upload thành công
  data:
    type: object
    properties:
      verification_status:
        type: string
        example: PENDING_VERIFICATION
```

### UserDocumentItemDto

Reference: `#/components/schemas/UserDocumentItemDto`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No |  |
| `doc_type` | string | No |  |
| `file_url` | string | No |  |

#### Schema definition

```yaml
type: object
properties:
  id:
    type: integer
    example: 1
  doc_type:
    type: string
    example: gplx_front
  file_url:
    type: string
    example: https://example.com/uploads/gplx_front.jpg
```

### UserDocumentGplxResponse

Reference: `#/components/schemas/UserDocumentGplxResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `message` | string | No |  |
| `data` | object | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  message:
    type: string
    example: Upload GPLX thành công
  data:
    type: object
    properties:
      documents:
        type: array
        items:
          $ref: '#/components/schemas/UserDocumentItemDto'
```

### UserDocumentCccdResponse

Reference: `#/components/schemas/UserDocumentCccdResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | object | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      documents:
        type: array
        items:
          $ref: '#/components/schemas/UserDocumentItemDto'
```

### UserDocumentSelfieResponse

Reference: `#/components/schemas/UserDocumentSelfieResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | object | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      file_url:
        type: string
        example: https://example.com/uploads/selfie.jpg
```

### SubmitVerificationRequest

Reference: `#/components/schemas/SubmitVerificationRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `gplx_doc_ids` | array | Yes |  |
| `cccd_doc_ids` | array | Yes |  |
| `selfie_doc_id` | integer | Yes |  |

#### Schema definition

```yaml
type: object
required:
- gplx_doc_ids
- cccd_doc_ids
- selfie_doc_id
properties:
  gplx_doc_ids:
    type: array
    items:
      type: integer
    example:
    - 1
    - 2
  cccd_doc_ids:
    type: array
    items:
      type: integer
    example:
    - 3
    - 4
  selfie_doc_id:
    type: integer
    example: 5
```

### SubmitVerificationResponse

Reference: `#/components/schemas/SubmitVerificationResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `message` | string | No |  |
| `data` | object | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  message:
    type: string
    example: Hồ sơ đã được gửi, chờ Admin duyệt
  data:
    type: object
    properties:
      verification_status:
        type: string
        example: pending
```

### CarDto

Reference: `#/components/schemas/CarDto`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No |  |
| `plateNumber` | string | No |  |
| `brand` | string | No |  |
| `model` | string | No |  |
| `year` | integer | No |  |
| `color` | string | No |  |
| `seats` | integer | No |  |
| `transmission` | string | No |  |
| `fuelType` | string | No |  |
| `pricePerDay` | number | No |  |
| `status` | string | No |  |
| `location` | string | No |  |
| `thumbnailUrl` | string | No |  |

#### Schema definition

```yaml
type: object
properties:
  id:
    type: integer
    example: 1
  plateNumber:
    type: string
    example: 51A-12345
  brand:
    type: string
    example: Toyota
  model:
    type: string
    example: Camry
  year:
    type: integer
    example: 2023
  color:
    type: string
    example: Trắng
  seats:
    type: integer
    example: 5
  transmission:
    type: string
    example: AUTOMATIC
  fuelType:
    type: string
    example: GASOLINE
  pricePerDay:
    type: number
    example: 1200000
  status:
    type: string
    example: AVAILABLE
  location:
    type: string
    example: TP.HCM
  thumbnailUrl:
    type: string
    example: https://uploads.vn/cars/camry.jpg
```

### CarPageApiResponse

Reference: `#/components/schemas/CarPageApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | object | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      content:
        type: array
        items:
          $ref: '#/components/schemas/CarDto'
      totalPages:
        type: integer
        example: 8
      totalElements:
        type: integer
        example: 150
```

### CarDetailApiResponse

Reference: `#/components/schemas/CarDetailApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | CarDto | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    $ref: '#/components/schemas/CarDto'
```

### CarListApiResponse

Reference: `#/components/schemas/CarListApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | array | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      $ref: '#/components/schemas/CarDto'
```

### CarCreateRequest

Reference: `#/components/schemas/CarCreateRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `plateNumber` | string | Yes |  |
| `brand` | string | Yes |  |
| `model` | string | Yes |  |
| `year` | integer | No |  |
| `seats` | integer | Yes |  |
| `pricePerDay` | number | Yes |  |

#### Schema definition

```yaml
type: object
required:
- plateNumber
- brand
- model
- seats
- pricePerDay
properties:
  plateNumber:
    type: string
    example: 51A-12345
  brand:
    type: string
    example: Toyota
  model:
    type: string
    example: Camry
  year:
    type: integer
    example: 2023
  seats:
    type: integer
    example: 5
  pricePerDay:
    type: number
    example: 1200000
```

### CarUpdateRequest

Reference: `#/components/schemas/CarUpdateRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `pricePerDay` | number | No |  |
| `description` | string | No |  |

#### Schema definition

```yaml
type: object
properties:
  pricePerDay:
    type: number
    example: 1300000
  description:
    type: string
    example: Xe mới bảo dưỡng định kỳ
```

### CarPricingRequest

Reference: `#/components/schemas/CarPricingRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `pricePerDay` | number | No |  |
| `priceWeekend` | number | No |  |
| `overtimeFeePerHour` | number | No |  |
| `overKmFee` | number | No |  |

#### Schema definition

```yaml
type: object
properties:
  pricePerDay:
    type: number
    example: 1200000
  priceWeekend:
    type: number
    example: 1400000
  overtimeFeePerHour:
    type: number
    example: 100000
  overKmFee:
    type: number
    example: 5000
```

### AvailabilityApiResponse

Reference: `#/components/schemas/AvailabilityApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | object | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      isAvailable:
        type: boolean
        example: true
```

### CalendarApiResponse

Reference: `#/components/schemas/CalendarApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | array | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      type: object
      properties:
        startDate:
          type: string
          format: date-time
        endDate:
          type: string
          format: date-time
        status:
          type: string
          example: BOOKED
```

### BookingCreateRequest

Reference: `#/components/schemas/BookingCreateRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `carId` | integer | Yes |  |
| `startDate` | string | Yes |  |
| `endDate` | string | Yes |  |
| `rentalType` | string | No |  |
| `deliveryAddress` | string | No |  |

#### Schema definition

```yaml
type: object
required:
- carId
- startDate
- endDate
properties:
  carId:
    type: integer
    example: 1
  startDate:
    type: string
    format: date-time
    example: '2026-10-15T08:00:00'
  endDate:
    type: string
    format: date-time
    example: '2026-10-18T18:00:00'
  rentalType:
    type: string
    example: SELF_DRIVE
  deliveryAddress:
    type: string
    example: Sân bay Tân Sơn Nhất
```

### BookingDto

Reference: `#/components/schemas/BookingDto`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No |  |
| `bookingCode` | string | No |  |
| `carId` | integer | No |  |
| `customerId` | integer | No |  |
| `status` | string | No |  |
| `totalAmount` | number | No |  |
| `depositAmount` | number | No |  |
| `startDate` | string | No |  |
| `endDate` | string | No |  |

#### Schema definition

```yaml
type: object
properties:
  id:
    type: integer
    example: 101
  bookingCode:
    type: string
    example: BK-20261015-001
  carId:
    type: integer
    example: 1
  customerId:
    type: integer
    example: 123
  status:
    type: string
    example: CONFIRMED
  totalAmount:
    type: number
    example: 3600000
  depositAmount:
    type: number
    example: 1080000
  startDate:
    type: string
    example: '2026-10-15T08:00:00'
  endDate:
    type: string
    example: '2026-10-18T18:00:00'
```

### BookingApiResponse

Reference: `#/components/schemas/BookingApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | BookingDto | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    $ref: '#/components/schemas/BookingDto'
```

### BookingListApiResponse

Reference: `#/components/schemas/BookingListApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | array | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      $ref: '#/components/schemas/BookingDto'
```

### PaymentCreateRequest

Reference: `#/components/schemas/PaymentCreateRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `bookingId` | integer | Yes |  |
| `amount` | number | Yes |  |
| `paymentType` | string | Yes |  |
| `paymentMethod` | string | No |  |

#### Schema definition

```yaml
type: object
required:
- bookingId
- amount
- paymentType
properties:
  bookingId:
    type: integer
    example: 101
  amount:
    type: number
    example: 1080000
  paymentType:
    type: string
    example: DEPOSIT
  paymentMethod:
    type: string
    example: MOMO
```

### PaymentDto

Reference: `#/components/schemas/PaymentDto`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No |  |
| `bookingId` | integer | No |  |
| `amount` | number | No |  |
| `status` | string | No |  |
| `paymentUrl` | string | No |  |

#### Schema definition

```yaml
type: object
properties:
  id:
    type: integer
    example: 501
  bookingId:
    type: integer
    example: 101
  amount:
    type: number
    example: 1080000
  status:
    type: string
    example: SUCCESS
  paymentUrl:
    type: string
    example: https://momo.vn/pay/order-123
```

### PaymentApiResponse

Reference: `#/components/schemas/PaymentApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | PaymentDto | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    $ref: '#/components/schemas/PaymentDto'
```

### PaymentListApiResponse

Reference: `#/components/schemas/PaymentListApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | array | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      $ref: '#/components/schemas/PaymentDto'
```

### HandoverPickupRequest

Reference: `#/components/schemas/HandoverPickupRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `bookingId` | integer | Yes |  |
| `startKm` | number | Yes |  |
| `startFuelPercent` | integer | Yes |  |
| `notes` | string | No |  |
| `images` | array | No |  |

#### Schema definition

```yaml
type: object
required:
- bookingId
- startKm
- startFuelPercent
properties:
  bookingId:
    type: integer
    example: 101
  startKm:
    type: number
    example: 25000
  startFuelPercent:
    type: integer
    example: 100
  notes:
    type: string
    example: Xe sạch sẽ
    không trầy xước: null
  images:
    type: array
    items:
      type: string
```

### HandoverReturnRequest

Reference: `#/components/schemas/HandoverReturnRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `bookingId` | integer | Yes |  |
| `endKm` | number | Yes |  |
| `endFuelPercent` | integer | Yes |  |
| `notes` | string | No |  |

#### Schema definition

```yaml
type: object
required:
- bookingId
- endKm
- endFuelPercent
properties:
  bookingId:
    type: integer
    example: 101
  endKm:
    type: number
    example: 25400
  endFuelPercent:
    type: integer
    example: 90
  notes:
    type: string
    example: Trả đúng hạn
    trầy nhẹ cản sau: null
```

### HandoverApiResponse

Reference: `#/components/schemas/HandoverApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | object | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      id:
        type: integer
        example: 77
      bookingId:
        type: integer
        example: 101
      lateHours:
        type: number
        example: 0
      overKm:
        type: number
        example: 0
      penaltyFee:
        type: number
        example: 0
```

### DriverCreateRequest

Reference: `#/components/schemas/DriverCreateRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes |  |
| `phone` | string | Yes |  |
| `licenseNumber` | string | Yes |  |
| `experienceYears` | integer | No |  |

#### Schema definition

```yaml
type: object
required:
- name
- phone
- licenseNumber
properties:
  name:
    type: string
    example: Trần Văn Tài
  phone:
    type: string
    example: 0912345678
  licenseNumber:
    type: string
    example: B2-998877
  experienceYears:
    type: integer
    example: 5
```

### DriverUpdateRequest

Reference: `#/components/schemas/DriverUpdateRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `experienceYears` | integer | No |  |
| `status` | string | No |  |

#### Schema definition

```yaml
type: object
properties:
  experienceYears:
    type: integer
    example: 6
  status:
    type: string
    example: ACTIVE
```

### DriverDto

Reference: `#/components/schemas/DriverDto`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No |  |
| `name` | string | No |  |
| `phone` | string | No |  |
| `status` | string | No |  |

#### Schema definition

```yaml
type: object
properties:
  id:
    type: integer
    example: 15
  name:
    type: string
    example: Trần Văn Tài
  phone:
    type: string
    example: 0912345678
  status:
    type: string
    example: ACTIVE
```

### DriverApiResponse

Reference: `#/components/schemas/DriverApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | DriverDto | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    $ref: '#/components/schemas/DriverDto'
```

### DriverListApiResponse

Reference: `#/components/schemas/DriverListApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | array | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      $ref: '#/components/schemas/DriverDto'
```

### ReviewCreateRequest

Reference: `#/components/schemas/ReviewCreateRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `booking_id` | integer | Yes |  |
| `car_rating` | integer | Yes |  |
| `owner_rating` | integer | Yes |  |
| `driver_rating` | integer | No |  |
| `comment` | string | No |  |
| `images` | array | No |  |
| `is_anonymous` | boolean | No |  |

#### Schema definition

```yaml
type: object
required:
- booking_id
- car_rating
- owner_rating
properties:
  booking_id:
    type: integer
    example: 100
  car_rating:
    type: integer
    minimum: 1
    maximum: 5
    example: 5
  owner_rating:
    type: integer
    minimum: 1
    maximum: 5
    example: 5
  driver_rating:
    type: integer
    minimum: 1
    maximum: 5
    nullable: true
    example: 5
  comment:
    type: string
    example: Xe rất tốt, chủ xe thân thiện!
  images:
    type: array
    items:
      type: string
      example: https://example.com/review1.jpg
  is_anonymous:
    type: boolean
    example: false
```

### ReviewReplyRequest

Reference: `#/components/schemas/ReviewReplyRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `reply` | string | Yes |  |

#### Schema definition

```yaml
type: object
required:
- reply
properties:
  reply:
    type: string
    example: Cảm ơn bạn đã tin tưởng!
```

### ReviewCreatedDto

Reference: `#/components/schemas/ReviewCreatedDto`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No |  |
| `car_rating` | integer | No |  |
| `owner_rating` | integer | No |  |
| `created_at` | string | No |  |

#### Schema definition

```yaml
type: object
properties:
  id:
    type: integer
    example: 50
  car_rating:
    type: integer
    example: 5
  owner_rating:
    type: integer
    example: 5
  created_at:
    type: string
    format: date-time
    example: '2026-10-18T10:00:00Z'
```

### ReviewCreateApiResponse

Reference: `#/components/schemas/ReviewCreateApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | ReviewCreatedDto | No |  |
| `message` | string | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    $ref: '#/components/schemas/ReviewCreatedDto'
  message:
    type: string
    example: Cảm ơn bạn đã đánh giá
```

### ReviewItemDto

Reference: `#/components/schemas/ReviewItemDto`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No |  |
| `reviewer_name` | string | No |  |
| `reviewer_avatar` | string | No |  |
| `car_rating` | integer | No |  |
| `comment` | string | No |  |
| `images` | array | No |  |
| `owner_reply` | string | No |  |
| `created_at` | string | No |  |

#### Schema definition

```yaml
type: object
properties:
  id:
    type: integer
    example: 50
  reviewer_name:
    type: string
    example: Nguyễn Văn A
  reviewer_avatar:
    type: string
    nullable: true
    example: https://...
  car_rating:
    type: integer
    example: 5
  comment:
    type: string
    example: Xe rất tốt!
  images:
    type: array
    items:
      type: string
  owner_reply:
    type: string
    nullable: true
    example: Cảm ơn bạn!
  created_at:
    type: string
    format: date-time
    example: '2026-10-18T10:00:00Z'
```

### ReviewSummaryDto

Reference: `#/components/schemas/ReviewSummaryDto`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `avg_rating` | number | No |  |
| `total` | integer | No |  |
| `star_5` | integer | No |  |
| `star_4` | integer | No |  |
| `star_3` | integer | No |  |
| `star_2` | integer | No |  |
| `star_1` | integer | No |  |

#### Schema definition

```yaml
type: object
properties:
  avg_rating:
    type: number
    example: 4.8
  total:
    type: integer
    example: 45
  star_5:
    type: integer
    example: 30
  star_4:
    type: integer
    example: 10
  star_3:
    type: integer
    example: 3
  star_2:
    type: integer
    example: 1
  star_1:
    type: integer
    example: 1
```

### CarReviewListDataDto

Reference: `#/components/schemas/CarReviewListDataDto`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `reviews` | array | No |  |
| `summary` | ReviewSummaryDto | No |  |
| `pagination` | PaginationMetadata | No |  |

#### Schema definition

```yaml
type: object
properties:
  reviews:
    type: array
    items:
      $ref: '#/components/schemas/ReviewItemDto'
  summary:
    $ref: '#/components/schemas/ReviewSummaryDto'
  pagination:
    $ref: '#/components/schemas/PaginationMetadata'
```

### CarReviewListApiResponse

Reference: `#/components/schemas/CarReviewListApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | CarReviewListDataDto | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    $ref: '#/components/schemas/CarReviewListDataDto'
```

### ReviewDto

Reference: `#/components/schemas/ReviewDto`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No |  |
| `carRating` | integer | No |  |
| `ownerRating` | integer | No |  |
| `comment` | string | No |  |
| `customerName` | string | No |  |

#### Schema definition

```yaml
type: object
properties:
  id:
    type: integer
    example: 88
  carRating:
    type: integer
    example: 5
  ownerRating:
    type: integer
    example: 5
  comment:
    type: string
    example: Rất hài lòng!
  customerName:
    type: string
    example: Nguyễn Văn A
```

### ReviewApiResponse

Reference: `#/components/schemas/ReviewApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | ReviewDto | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    $ref: '#/components/schemas/ReviewDto'
```

### ReviewListApiResponse

Reference: `#/components/schemas/ReviewListApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | array | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      $ref: '#/components/schemas/ReviewDto'
```

### DisputeCreateRequest

Reference: `#/components/schemas/DisputeCreateRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `bookingId` | integer | Yes |  |
| `reason` | string | Yes |  |
| `claimAmount` | number | Yes |  |
| `evidenceImages` | array | No |  |

#### Schema definition

```yaml
type: object
required:
- bookingId
- reason
- claimAmount
properties:
  bookingId:
    type: integer
    example: 101
  reason:
    type: string
    example: Xe bị hỏng điều hòa giữa đường
  claimAmount:
    type: number
    example: 500000
  evidenceImages:
    type: array
    items:
      type: string
```

### DisputeResolveRequest

Reference: `#/components/schemas/DisputeResolveRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `resolution` | string | Yes |  |
| `refundAmount` | number | Yes |  |

#### Schema definition

```yaml
type: object
required:
- resolution
- refundAmount
properties:
  resolution:
    type: string
    example: Đồng ý hoàn lại 50% tiền cọc cho khách
  refundAmount:
    type: number
    example: 500000
```

### DisputeDto

Reference: `#/components/schemas/DisputeDto`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No |  |
| `bookingId` | integer | No |  |
| `status` | string | No |  |
| `claimAmount` | number | No |  |

#### Schema definition

```yaml
type: object
properties:
  id:
    type: integer
    example: 33
  bookingId:
    type: integer
    example: 101
  status:
    type: string
    example: PENDING
  claimAmount:
    type: number
    example: 500000
```

### DisputeApiResponse

Reference: `#/components/schemas/DisputeApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | DisputeDto | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    $ref: '#/components/schemas/DisputeDto'
```

### DisputeListApiResponse

Reference: `#/components/schemas/DisputeListApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | object | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      disputes:
        type: array
        items:
          $ref: '#/components/schemas/DisputeDto'
      pagination:
        type: object
        properties:
          page:
            type: integer
            example: 1
          limit:
            type: integer
            example: 10
          total:
            type: integer
            example: 15
          total_pages:
            type: integer
            example: 2
```

### WithdrawalCreateRequest

Reference: `#/components/schemas/WithdrawalCreateRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `amount` | number | Yes |  |
| `bankName` | string | Yes |  |
| `accountNumber` | string | Yes |  |
| `accountName` | string | Yes |  |

#### Schema definition

```yaml
type: object
required:
- amount
- bankName
- accountNumber
- accountName
properties:
  amount:
    type: number
    example: 5000000
  bankName:
    type: string
    example: Vietcombank
  accountNumber:
    type: string
    example: '0071001234567'
  accountName:
    type: string
    example: NGUYEN VAN A
```

### WithdrawalDto

Reference: `#/components/schemas/WithdrawalDto`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | integer | No |  |
| `amount` | number | No |  |
| `status` | string | No |  |
| `bankName` | string | No |  |

#### Schema definition

```yaml
type: object
properties:
  id:
    type: integer
    example: 91
  amount:
    type: number
    example: 5000000
  status:
    type: string
    example: PENDING
  bankName:
    type: string
    example: Vietcombank
```

### WithdrawalApiResponse

Reference: `#/components/schemas/WithdrawalApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | WithdrawalDto | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    $ref: '#/components/schemas/WithdrawalDto'
```

### WithdrawalListApiResponse

Reference: `#/components/schemas/WithdrawalListApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | array | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      $ref: '#/components/schemas/WithdrawalDto'
```

### WalletApiResponse

Reference: `#/components/schemas/WalletApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | object | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      balance:
        type: number
        example: 12500000
      lockedAmount:
        type: number
        example: 5000000
```

### AdminDashboardApiResponse

Reference: `#/components/schemas/AdminDashboardApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | object | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      totalRevenue:
        type: number
        example: 150000000
      platformRevenue:
        type: number
        example: 15000000
      cancelRate:
        type: number
        example: 0.04
      csat:
        type: number
        example: 4.85
```

### AdminUserListApiResponse

Reference: `#/components/schemas/AdminUserListApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | array | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      $ref: '#/components/schemas/UserDto'
```

### AIChatRequest

Reference: `#/components/schemas/AIChatRequest`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `message` | string | Yes |  |
| `role` | string | No |  |

#### Schema definition

```yaml
type: object
required:
- message
properties:
  message:
    type: string
    example: Tôi muốn tìm xe 7 chỗ đi Vũng Tàu
  role:
    type: string
    example: CUSTOMER
```

### AIChatApiResponse

Reference: `#/components/schemas/AIChatApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | object | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      reply:
        type: string
        example: Dưới đây là một số dòng xe 7 chỗ phù hợp...
      suggestions:
        type: array
        items:
          type: string
```

### AISuggestionsApiResponse

Reference: `#/components/schemas/AISuggestionsApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | array | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      type: string
```

### AIChatHistoryApiResponse

Reference: `#/components/schemas/AIChatHistoryApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | array | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      type: object
      properties:
        role:
          type: string
          example: user
        content:
          type: string
          example: Xin chào
```

### NotificationListApiResponse

Reference: `#/components/schemas/NotificationListApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | array | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: array
    items:
      type: object
      properties:
        id:
          type: integer
          example: 1
        title:
          type: string
          example: Đơn đặt xe thành công
        content:
          type: string
          example: Đơn BK-101 đã được xác nhận
        isRead:
          type: boolean
          example: false
```

### FileUploadApiResponse

Reference: `#/components/schemas/FileUploadApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | object | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      fileUrl:
        type: string
        example: http://localhost:8080/api/v1/uploads/cars/img1.jpg
```

### ExcelImportApiResponse

Reference: `#/components/schemas/ExcelImportApiResponse`

Type: `object`

| Property | Type | Required | Description |
|---|---|---|---|
| `success` | boolean | No |  |
| `data` | object | No |  |

#### Schema definition

```yaml
type: object
properties:
  success:
    type: boolean
    example: true
  data:
    type: object
    properties:
      totalRows:
        type: integer
        example: 20
      validRows:
        type: integer
        example: 19
      errorRows:
        type: integer
        example: 1
```

## 8. Shared Response Definitions

### BadRequest

```yaml
description: Dữ liệu gửi lên không hợp lệ (Validation Error)
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiErrorResponse'
```

### Unauthorized

```yaml
description: Chưa đăng nhập hoặc Token JWT không hợp lệ
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiErrorResponse'
```

### Conflict

```yaml
description: Dữ liệu đã tồn tại (SĐT hoặc Email đã đăng ký)
content:
  application/json:
    schema:
      $ref: '#/components/schemas/ApiErrorResponse'
```

## 9. Additional Component Definitions

## 10. Contract Verification Summary

| Metric | Value |
|---|---:|
| Documented paths | 79 |
| Documented operations | 89 |
| Documented schemas | 75 |
| Documented modules | 14 |
| Executed API tests | 0 |

Runtime verification must be performed separately.

Update this reference whenever the source OpenAPI
specification changes.

---

End of API Contract.
