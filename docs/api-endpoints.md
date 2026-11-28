# Danh mục REST API (sinh tự động từ mã nguồn)

> Sinh bằng `node scripts/gen-api-endpoints.js` (đọc annotation `@Get/Post/Put/Patch/DeleteMapping` trong `backend/src/main/java/**/*Controller.java`). Context path: `/api/v1`. Chạy lại script sau khi thêm/sửa endpoint.
> Tổng: **174** phương thức xử lý trong **28** controller (một số đường dẫn có 2 biến thể JSON / multipart, hoặc alias tương thích ngược).
> `openapi.yaml` là hợp đồng API chi tiết (request/response mẫu) cho các luồng chính; Swagger UI khi chạy backend (`/api/v1/swagger-ui.html`) sinh đặc tả đầy đủ theo code.
> Cột "Quyền": `@PreAuthorize` ở controller/method; để trống = theo SecurityConfig (đa số yêu cầu JWT; nhóm `/auth`, `/public`, `/health`, `/files`, `/payments/callback`, `/driver/assignments` là public; `GET /cars/**` và `GET /reviews/cars|owner/**` công khai).

## admin (54)

| Method | Path | Handler | Quyền |
|---|---|---|---|
| GET | `/api/v1/admin/approvals` | AdminApprovalController.getLogsByTarget | ADMIN (SecurityConfig) |
| GET | `/api/v1/admin/approvals/my` | AdminApprovalController.getMyApprovalHistory | ADMIN (SecurityConfig) |
| POST | `/api/v1/admin/approvals` | AdminApprovalController.logApproval | ADMIN (SecurityConfig) |
| GET | `/api/v1/admin/config` | AdminConfigController.getAllConfigs | ADMIN (SecurityConfig) |
| GET | `/api/v1/admin/config/{key}` | AdminConfigController.getConfigByKey | ADMIN (SecurityConfig) |
| PUT | `/api/v1/admin/config/{key}` | AdminConfigController.updateConfig | ADMIN (SecurityConfig) |
| POST | `/api/v1/admin/config` | AdminConfigController.createConfig | ADMIN (SecurityConfig) |
| GET | `/api/v1/admin/dashboard/stats` | AdminDashboardController.getStats | ADMIN |
| GET | `/api/v1/admin/dashboard/deposits` | AdminDashboardController.getDeposits | ADMIN |
| GET | `/api/v1/admin/disputes` | AdminDisputeController.getAllDisputes | ADMIN |
| GET | `/api/v1/admin/disputes/{id}` | AdminDisputeController.getDisputeById | ADMIN |
| GET | `/api/v1/admin/disputes/pending-count` | AdminDisputeController.countPending | ADMIN |
| PUT | `/api/v1/admin/disputes/{id}/approve-raiser` | AdminDisputeController.approveRaiser | ADMIN |
| PUT | `/api/v1/admin/disputes/{id}/approve-against` | AdminDisputeController.approveAgainst | ADMIN |
| POST | `/api/v1/admin/disputes/{id}/resolve` | AdminDisputeController.resolveDisputePost | ADMIN |
| PUT | `/api/v1/admin/disputes/{id}/resolve` | AdminDisputeController.resolveDispute | ADMIN |
| PUT | `/api/v1/admin/disputes/{id}/request-evidence` | AdminDisputeController.requestEvidence | ADMIN |
| PUT | `/api/v1/admin/disputes/{id}/finalize` | AdminDisputeController.finalizeDispute | ADMIN |
| GET | `/api/v1/admin/drivers` | AdminDriverController.getAllDrivers | ADMIN |
| GET | `/api/v1/admin/drivers/count` | AdminDriverController.countByStatus | ADMIN |
| PUT | `/api/v1/admin/drivers/{id}/approve` | AdminDriverController.approveDriver | ADMIN |
| PUT | `/api/v1/admin/drivers/{id}/reject` | AdminDriverController.rejectDriver | ADMIN |
| PUT | `/api/v1/admin/drivers/{id}/lock` | AdminDriverController.lockDriver | ADMIN |
| PUT | `/api/v1/admin/drivers/{id}/unlock` | AdminDriverController.unlockDriver | ADMIN |
| PATCH | `/api/v1/admin/drivers/{id}/status` | AdminDriverController.updateStatus | ADMIN |
| GET | `/api/v1/admin/owner-requests` | AdminOwnerRequestController.getAllRequests | ADMIN |
| GET | `/api/v1/admin/owner-requests/pending-count` | AdminOwnerRequestController.countPending | ADMIN |
| GET | `/api/v1/admin/owner-requests/{id}` | AdminOwnerRequestController.getRequestById | ADMIN |
| PUT | `/api/v1/admin/owner-requests/{id}/approve` | AdminOwnerRequestController.approveRequest | ADMIN |
| PUT | `/api/v1/admin/owner-requests/{id}/reject` | AdminOwnerRequestController.rejectRequest | ADMIN |
| GET | `/api/v1/admin/refunds` | AdminRefundController.getAllRefunds | ADMIN |
| GET | `/api/v1/admin/refunds/pending-count` | AdminRefundController.countPending | ADMIN |
| PUT | `/api/v1/admin/refunds/{id}/approve` | AdminRefundController.approveRefund | ADMIN |
| PUT | `/api/v1/admin/refunds/{id}/reject` | AdminRefundController.rejectRefund | ADMIN |
| GET | `/api/v1/admin/users` | AdminUserController.getAllUsers | ADMIN |
| GET | `/api/v1/admin/users/stats` | AdminUserController.getStats | ADMIN |
| GET | `/api/v1/admin/users/{id}` | AdminUserController.getUserById | ADMIN |
| PUT | `/api/v1/admin/users/{id}/lock` | AdminUserController.lockUser | ADMIN |
| PUT | `/api/v1/admin/users/{id}/unlock` | AdminUserController.unlockUser | ADMIN |
| DELETE | `/api/v1/admin/users/{id}` | AdminUserController.deleteUser | ADMIN |
| GET | `/api/v1/admin/users/{id}/verification` | AdminUserController.getUserVerification | ADMIN |
| PUT | `/api/v1/admin/users/{id}/verify` | AdminUserController.verifyUser | ADMIN |
| PUT | `/api/v1/admin/users/{id}/reject-verification` | AdminUserController.rejectVerification | ADMIN |
| GET | `/api/v1/admin/withdrawals` | AdminWithdrawalController.getAllWithdrawals | ADMIN |
| GET | `/api/v1/admin/withdrawals/{id}` | AdminWithdrawalController.getWithdrawalById | ADMIN |
| GET | `/api/v1/admin/withdrawals/pending-count` | AdminWithdrawalController.countPending | ADMIN |
| PUT | `/api/v1/admin/withdrawals/{id}/approve` | AdminWithdrawalController.approveWithdrawal | ADMIN |
| PUT | `/api/v1/admin/withdrawals/{id}/reject` | AdminWithdrawalController.rejectWithdrawal | ADMIN |
| POST | `/api/v1/owner-register/submit` | OwnerRegistrationController.submitRequest | CUSTOMER |
| POST | `/api/v1/owner-register/{requestId}/upload` | OwnerRegistrationController.uploadDocuments | CUSTOMER |
| GET | `/api/v1/owner-register/my` | OwnerRegistrationController.getMyRequest | CUSTOMER |
| POST | `/api/v1/owner/withdrawals` | OwnerWithdrawalController.createWithdrawal | OWNER |
| GET | `/api/v1/owner/withdrawals/my` | OwnerWithdrawalController.getMyWithdrawals | OWNER |
| GET | `/api/v1/owner/withdrawals/balance` | OwnerWithdrawalController.getBalance | OWNER |

## auth (9)

| Method | Path | Handler | Quyền |
|---|---|---|---|
| POST | `/api/v1/auth/register` | AuthController.register |  |
| POST | `/api/v1/auth/login` | AuthController.login |  |
| POST | `/api/v1/auth/refresh` | AuthController.refresh |  |
| POST | `/api/v1/auth/logout` | AuthController.logout |  |
| GET | `/api/v1/auth/me` | AuthController.getCurrentUser |  |
| PUT | `/api/v1/auth/me` | AuthController.updateProfile |  |
| POST | `/api/v1/auth/change-password` | AuthController.changePassword |  |
| POST | `/api/v1/auth/forgot-password` | AuthController.forgotPassword |  |
| POST | `/api/v1/auth/reset-password` | AuthController.resetPassword |  |

## booking (10)

| Method | Path | Handler | Quyền |
|---|---|---|---|
| POST | `/api/v1/bookings` | BookingController.createBooking |  |
| GET | `/api/v1/bookings/{id}` | BookingController.getBookingById |  |
| GET | `/api/v1/bookings/my` | BookingController.getMyBookings |  |
| GET | `/api/v1/bookings/owner` | BookingController.getOwnerBookings |  |
| GET | `/api/v1/bookings/status/{status}` | BookingController.getBookingsByStatus |  |
| POST | `/api/v1/bookings/{id}/re-request-refund` | BookingController.reRequestRefund |  |
| PUT | `/api/v1/bookings/{id}/status` | BookingController.updateBookingStatus |  |
| PUT | `/api/v1/bookings/{id}/paid` | BookingController.markAsPaid | ADMIN |
| PUT | `/api/v1/bookings/{id}/start` | BookingController.startRental |  |
| PUT | `/api/v1/bookings/{id}/complete` | BookingController.completeRental |  |

## car (21)

| Method | Path | Handler | Quyền |
|---|---|---|---|
| GET | `/api/v1/cars` | CarController.getCars |  |
| GET | `/api/v1/cars/{id}` | CarController.getCarById |  |
| GET | `/api/v1/cars/{id}/reviews` | CarController.getCarReviews |  |
| GET | `/api/v1/cars/available` | CarController.getAvailableCars |  |
| GET | `/api/v1/cars/search` | CarController.searchCars |  |
| GET | `/api/v1/cars/{id}/images` | CarController.getCarImages |  |
| POST | `/api/v1/cars` | CarController.createCar | OWNER, ADMIN |
| PUT | `/api/v1/cars/{id}` | CarController.updateCar | OWNER, ADMIN |
| DELETE | `/api/v1/cars/{id}` | CarController.deleteCar | OWNER, ADMIN |
| GET | `/api/v1/cars/my` | CarController.getMyCars | OWNER, ADMIN |
| POST | `/api/v1/cars/{id}/images` | CarController.uploadImages | OWNER, ADMIN |
| DELETE | `/api/v1/cars/{id}/images` | CarController.deleteImage | OWNER, ADMIN |
| POST | `/api/v1/cars/{id}/documents` | CarController.uploadDocuments | OWNER, ADMIN |
| PUT | `/api/v1/cars/{id}/pricing` | CarController.configurePricing | OWNER, ADMIN |
| POST | `/api/v1/cars/{id}/blocked-dates` | CarController.blockDates | OWNER, ADMIN |
| DELETE | `/api/v1/cars/{id}/blocked-dates/{blockId}` | CarController.unblockDates | OWNER, ADMIN |
| PUT | `/api/v1/cars/{id}/approve` | CarController.approveCar | ADMIN |
| PUT | `/api/v1/cars/{id}/reject` | CarController.rejectCar | ADMIN |
| GET | `/api/v1/owner/cars` | OwnerCarController.getMyCars | OWNER, ADMIN |
| PATCH | `/api/v1/owner/cars/{id}/status` | OwnerCarController.updateStatus | OWNER, ADMIN |
| POST | `/api/v1/owner/cars/import` | OwnerCarController.importCars | OWNER, ADMIN |

## common (4)

| Method | Path | Handler | Quyền |
|---|---|---|---|
| GET | `/api/v1/files/**` | FileController.serveFile |  |
| GET | `/api/v1/health` | HealthController.health |  |
| GET | `/api/v1/public/config` | PublicConfigController.getPublicConfigs |  |
| GET | `/api/v1/public/config/{key}` | PublicConfigController.getConfig |  |

## dispute (10)

| Method | Path | Handler | Quyền |
|---|---|---|---|
| POST | `/api/v1/disputes` (json) | DisputeController.createDisputeJson |  |
| POST | `/api/v1/disputes` (multipart) | DisputeController.createDisputeMultipart |  |
| GET | `/api/v1/disputes/my` | DisputeController.getMyDisputes |  |
| GET | `/api/v1/disputes/against-me` | DisputeController.getDisputesAgainstMe |  |
| GET | `/api/v1/disputes/{id}` | DisputeController.getDisputeById |  |
| PUT | `/api/v1/disputes/{id}/submit-evidence` | DisputeController.submitEvidence |  |
| POST | `/api/v1/disputes/upload` | DisputeController.uploadEvidence |  |
| PUT | `/api/v1/disputes/{id}/accept` | DisputeController.acceptDispute |  |
| PUT | `/api/v1/disputes/{id}/counter-evidence` | DisputeController.fileCounterEvidence |  |
| PUT | `/api/v1/disputes/{id}/submit-review` | DisputeController.submitReview |  |

## driver (19)

| Method | Path | Handler | Quyền |
|---|---|---|---|
| GET | `/api/v1/driver/assignments/{id}` | DriverAssignmentController.getAssignment |  |
| POST | `/api/v1/driver/assignments/{id}/accept` | DriverAssignmentController.accept |  |
| POST | `/api/v1/driver/assignments/{id}/reject` | DriverAssignmentController.reject |  |
| POST | `/api/v1/driver/assignments/booking/{bookingId}/auto-assign` | DriverAssignmentController.autoAssign |  |
| GET | `/api/v1/driver/assignments/booking/{bookingId}` | DriverAssignmentController.getByBooking |  |
| POST | `/api/v1/drivers` | DriverController.createDriver |  |
| GET | `/api/v1/drivers/my` | DriverController.getMyDrivers |  |
| POST | `/api/v1/drivers/assign` | DriverController.assignDriver |  |
| POST | `/api/v1/drivers/assignments/{id}/accept` | DriverController.acceptAssignment |  |
| POST | `/api/v1/drivers/assignments/{id}/reject` | DriverController.rejectAssignment |  |
| GET | `/api/v1/drivers/{id}` | DriverController.getDriverById |  |
| PUT | `/api/v1/drivers/{id}` | DriverController.updateDriver |  |
| PATCH | `/api/v1/drivers/{id}/status` | DriverController.updateStatus |  |
| DELETE | `/api/v1/drivers/{id}` | DriverController.deleteDriver |  |
| GET | `/api/v1/drivers/available` | DriverController.getAvailableDrivers |  |
| PUT | `/api/v1/drivers/{id}/approve` | DriverController.approveDriver |  |
| PUT | `/api/v1/drivers/{id}/reject` | DriverController.rejectDriver |  |
| POST | `/api/v1/owner/drivers/import` | OwnerDriverController.importDrivers | OWNER, ADMIN |
| POST | `/api/v1/owner/drivers/upload-avatar` | OwnerDriverController.uploadAvatar | OWNER, ADMIN |

## handover (12)

| Method | Path | Handler | Quyền |
|---|---|---|---|
| GET | `/api/v1/handovers/fee-config` | HandoverController.getFeeConfig |  |
| POST | `/api/v1/handovers/pickup` (multipart) | HandoverController.createPickupMultipart |  |
| POST | `/api/v1/handovers/pickup` (json) | HandoverController.createPickupJson |  |
| POST | `/api/v1/handovers/return` (multipart) | HandoverController.createReturnMultipart |  |
| POST | `/api/v1/handovers/return` (json) | HandoverController.createReturnJson |  |
| POST | `/api/v1/handovers/{id}/confirm` | HandoverController.confirmHandover |  |
| POST | `/api/v1/handovers` | HandoverController.createHandover | OWNER, ADMIN |
| GET | `/api/v1/handovers/{id}` | HandoverController.getHandoverById |  |
| GET | `/api/v1/handovers/booking/{bookingId}` | HandoverController.getHandoversByBooking |  |
| POST | `/api/v1/handovers/{id}/sign` | HandoverController.signHandover |  |
| POST | `/api/v1/handovers/upload-signature` | HandoverController.uploadSignature |  |
| POST | `/api/v1/handovers/upload-image` | HandoverController.uploadImage |  |

## notification (7)

| Method | Path | Handler | Quyền |
|---|---|---|---|
| GET | `/api/v1/notifications` | NotificationController.getMyNotifications |  |
| GET | `/api/v1/notifications/unread-count` | NotificationController.countUnread |  |
| PUT | `/api/v1/notifications/{id}/read` | NotificationController.markAsRead |  |
| PUT | `/api/v1/notifications/read-all` | NotificationController.markAllAsRead |  |
| DELETE | `/api/v1/notifications/{id}` | NotificationController.deleteNotification |  |
| DELETE | `/api/v1/notifications/batch` | NotificationController.deleteBatch |  |
| DELETE | `/api/v1/notifications/all` | NotificationController.deleteAll |  |

## payment (8)

| Method | Path | Handler | Quyền |
|---|---|---|---|
| POST | `/api/v1/payments` | PaymentController.createPayment |  |
| GET | `/api/v1/payments/{id}` | PaymentController.getPaymentById |  |
| GET | `/api/v1/payments/booking/{bookingId}` | PaymentController.getPaymentsByBooking |  |
| GET | `/api/v1/payments/my` | PaymentController.getMyPayments |  |
| POST | `/api/v1/payments/callback/{gateway}` | PaymentController.gatewayCallback |  |
| POST | `/api/v1/payments/callback/momo` | PaymentController.momoCallback |  |
| POST | `/api/v1/payments/{id}/mock-success` | PaymentController.mockSuccess |  |
| POST | `/api/v1/payments/{id}/refund` | PaymentController.refundPayment | ADMIN |

## review (10)

| Method | Path | Handler | Quyền |
|---|---|---|---|
| POST | `/api/v1/reviews` | ReviewController.createReview |  |
| GET | `/api/v1/reviews/cars/{carId}` | ReviewController.getReviewsByCar |  |
| POST | `/api/v1/reviews/{id}/reply` | ReviewController.replyToReview |  |
| POST | `/api/v1/reviews/{id}/customer-reply` | ReviewController.customerReplyToReview |  |
| GET | `/api/v1/reviews/{id}/replies` | ReviewController.getReplies |  |
| POST | `/api/v1/reviews/{id}/replies` | ReviewController.addReply |  |
| GET | `/api/v1/reviews/my` | ReviewController.getMyReviews |  |
| GET | `/api/v1/reviews/owner/{ownerId}` | ReviewController.getReviewsByOwner |  |
| GET | `/api/v1/reviews/all` | ReviewController.getAllReviews |  |
| DELETE | `/api/v1/reviews/{id}` | ReviewController.deleteReview |  |

## user (10)

| Method | Path | Handler | Quyền |
|---|---|---|---|
| GET | `/api/v1/users/me` | UserController.getMe |  |
| PUT | `/api/v1/users/me` | UserController.updateProfile |  |
| POST | `/api/v1/users/documents/gplx` | UserController.uploadGplx |  |
| POST | `/api/v1/users/documents/cccd` | UserController.uploadCccd |  |
| POST | `/api/v1/users/documents/selfie` | UserController.uploadSelfie |  |
| POST | `/api/v1/users/submit-verification` | UserController.submitVerification |  |
| POST | `/api/v1/users/change-password` | UserController.changePassword |  |
| POST | `/api/v1/verification/upload` | VerificationController.upload |  |
| POST | `/api/v1/verification/submit` | VerificationController.submit |  |
| GET | `/api/v1/verification/me` | VerificationController.getMyVerification |  |

