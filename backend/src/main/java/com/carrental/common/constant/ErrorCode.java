package com.carrental.common.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // ===== COMMON (1xxx) =====
    UNCATEGORIZED_EXCEPTION(1000, "Lỗi không xác định"),
    INVALID_KEY(1001, "Key không hợp lệ"),
    VALIDATION_ERROR(1002, "Dữ liệu không hợp lệ"),

    // ===== USER (2xxx) =====
    USER_NOT_FOUND(2001, "Không tìm thấy người dùng"),
    USER_EXISTED(2002, "Người dùng đã tồn tại"),
    EMAIL_EXISTED(2003, "Email đã được sử dụng"),
    PHONE_EXISTED(2004, "Số điện thoại đã được sử dụng"),
    USER_NOT_VERIFIED(2005, "Tài khoản chưa được xác thực"),
    USER_LOCKED(2006, "Tài khoản đã bị khóa"),

    // ===== ROLE / PERMISSION (21xx) =====
    ROLE_NOT_FOUND(2101, "Không tìm thấy vai trò"),
    PERMISSION_DENIED(2102, "Bạn không có quyền thực hiện hành động này"),

    // ===== AUTH (3xxx) =====
    UNAUTHENTICATED(3001, "Chưa xác thực"),
    UNAUTHORIZED(3002, "Không có quyền truy cập"),
    INVALID_TOKEN(3003, "Token không hợp lệ"),
    TOKEN_EXPIRED(3004, "Token đã hết hạn"),
    INVALID_CREDENTIALS(3005, "Sai số điện thoại hoặc mật khẩu"),
    REFRESH_TOKEN_INVALID(3006, "Refresh token không hợp lệ"),
    REFRESH_TOKEN_EXPIRED(3007, "Refresh token đã hết hạn"),
    ACCOUNT_DISABLED(3008, "Tài khoản đã bị vô hiệu hóa"),

    // ===== CAR (4xxx) =====
    CAR_NOT_FOUND(4001, "Không tìm thấy xe"),
    CAR_NOT_AVAILABLE(4002, "Xe không khả dụng"),
    CAR_PLATE_EXISTED(4003, "Biển số xe đã tồn tại"),
    CAR_NOT_OWNED(4004, "Bạn không sở hữu xe này"),

    // ===== BOOKING (5xxx) =====
    BOOKING_NOT_FOUND(5001, "Không tìm thấy đơn đặt xe"),
    BOOKING_ALREADY_EXISTS(5002, "Xe đã được đặt trong khoảng thời gian này"),
    BOOKING_CANNOT_CANCEL(5003, "Không thể hủy đơn ở trạng thái này"),
    INVALID_BOOKING_DATES(5004, "Ngày trả phải sau ngày nhận"),
    BOOKING_STATUS_INVALID(5005, "Trạng thái đơn không hợp lệ"),
    BOOKING_NOT_OWNED(5006, "Bạn không sở hữu đơn này"),

    // ===== PAYMENT (6xxx) =====
    PAYMENT_NOT_FOUND(6001, "Không tìm thấy giao dịch"),
    PAYMENT_FAILED(6002, "Thanh toán thất bại"),
    PAYMENT_INVALID_SIGNATURE(6003, "Chữ ký thanh toán không hợp lệ"),

    // ===== FILE UPLOAD (7xxx) =====
    FILE_EMPTY(7001, "File rỗng"),
    FILE_TOO_LARGE(7002, "File quá lớn"),
    FILE_INVALID_FORMAT(7003, "Định dạng file không hợp lệ"),
    FILE_UPLOAD_FAILED(7004, "Upload file thất bại"),

    // ===== REVIEW (8xxx) =====
    REVIEW_NOT_FOUND(8001, "Không tìm thấy đánh giá"),
    REVIEW_ALREADY_EXISTS(8002, "Bạn đã đánh giá đơn này"),

    // ===== DRIVER (9xxx) =====
    DRIVER_NOT_FOUND(9001, "Không tìm thấy tài xế"),
    DRIVER_NOT_AVAILABLE(9002, "Tài xế không khả dụng"),

    // ===== AI (10xxx) =====
    AI_SERVICE_UNAVAILABLE(10001, "AI service tạm thời không khả dụng"),
    AI_SERVICE_TIMEOUT(10002, "AI service phản hồi quá lâu"),

    // ===== NOTIFICATION (11xxx) =====
    NOTIFICATION_NOT_FOUND(11001, "Không tìm thấy thông báo"),
    EMAIL_SEND_FAILED(11002, "Gửi email thất bại"),
    SMS_SEND_FAILED(11003, "Gửi SMS thất bại"),

    // ===== EXCEL (12xxx) =====
    EXCEL_INVALID_FORMAT(12001, "File Excel không đúng định dạng"),
    EXCEL_EMPTY(12002, "File Excel rỗng"),
    EXCEL_ROW_ERROR(12003, "Có lỗi trong file Excel"),

    // ===== ADMIN / DISPUTE (13xxx) =====
    DISPUTE_NOT_FOUND(13001, "Không tìm thấy tranh chấp"),
    DISPUTE_ALREADY_RESOLVED(13002, "Tranh chấp đã được giải quyết"),
    DISPUTE_NOT_OWNED(13003, "Bạn không có quyền xử lý tranh chấp này"),
    DISPUTE_INVALID_STATUS(13004, "Trạng thái tranh chấp không hợp lệ để thực hiện hành động này"),

    // ===== WITHDRAWAL (14xxx) =====
    WITHDRAWAL_NOT_FOUND(14001, "Không tìm thấy yêu cầu rút tiền"),
    WITHDRAWAL_INSUFFICIENT_BALANCE(14002, "Số dư không đủ"),
    WITHDRAWAL_ALREADY_PROCESSED(14003, "Yêu cầu rút tiền đã được xử lý"),
    WITHDRAWAL_MIN_AMOUNT(14004, "Số tiền rút dưới mức tối thiểu"),

    // ===== APPROVAL (15xxx) =====
    APPROVAL_NOT_FOUND(15001, "Không tìm thấy hồ sơ cần duyệt"),
    APPROVAL_ALREADY_PROCESSED(15002, "Hồ sơ đã được duyệt"),
    APPROVAL_INVALID_TYPE(15003, "Loại hồ sơ không hợp lệ"),

    // ===== CONFIG (16xxx) =====
    CONFIG_NOT_FOUND(16001, "Không tìm thấy cấu hình"),
    CONFIG_INVALID_VALUE(16002, "Giá trị cấu hình không hợp lệ");

    private final int code;
    private final String message;
}