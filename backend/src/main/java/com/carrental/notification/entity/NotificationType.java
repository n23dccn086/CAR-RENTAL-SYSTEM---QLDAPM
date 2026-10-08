package com.carrental.notification.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NotificationType {

    // ===== BOOKING FLOW =====
    BOOKING_NEW("Đơn đặt xe mới"),
    BOOKING_APPROVED("Đơn đã được duyệt"),
    BOOKING_REJECTED("Đơn bị từ chối"),
    BOOKING_CANCELLED("Đơn đã hủy"),
    BOOKING_COMPLETED("Đơn đã hoàn tất"),
    BOOKING_FINAL_PAYMENT("Cần thanh toán nốt"),
    BOOKING_REMINDER("Nhắc nhở thanh toán"),
    BOOKING_DRIVER_ASSIGNED("Đã gán tài xế"),
    BOOKING_DRIVER_ACCEPTED("Tài xế đã nhận chuyến"),
    BOOKING_DRIVER_REJECTED("Tài xế từ chối chuyến"),

    // ===== PAYMENT FLOW =====
    PAYMENT_SUCCESS("Thanh toán thành công"),
    PAYMENT_FAILED("Thanh toán thất bại"),

    // ===== REFUND FLOW =====
    REFUND_REQUESTED("Yêu cầu hoàn tiền mới"),
    REFUND_SUCCESS("Hoàn tiền thành công"),
    REFUND_REJECTED("Hoàn tiền bị từ chối"),

    // ===== CAR FLOW =====
    CAR_PENDING("Xe chờ duyệt"),
    CAR_RESUBMITTED("Xe cần duyệt lại"),
    CAR_APPROVED("Xe đã được duyệt"),
    CAR_REJECTED("Xe bị từ chối"),

    // ===== DRIVER FLOW =====
    DRIVER_PENDING("Tài xế chờ duyệt"),
    DRIVER_APPROVED("Tài xế đã được duyệt"),
    DRIVER_REJECTED("Tài xế bị từ chối"),

    // ===== HANDOVER FLOW =====
    HANDOVER_PICKUP_CREATED("Biên bản giao xe đã tạo"),
    HANDOVER_PICKUP_SIGNED("Biên bản giao xe đã ký"),
    HANDOVER_RETURN_CREATED("Biên bản nhận xe đã tạo"),
    HANDOVER_RETURN_SIGNED("Biên bản nhận xe đã ký"),

    // ===== REVIEW FLOW =====
    REVIEW_NEW("Đánh giá mới"),
    REVIEW_REPLY("Phản hồi đánh giá"),

    // ===== DISPUTE FLOW =====
    DISPUTE_CREATED("Tranh chấp mới"),
    DISPUTE_COUNTER_FILED("Đã phản bác"),
    DISPUTE_ACCEPTED("Đã đồng ý tranh chấp"),
    DISPUTE_NEED_EVIDENCE("Cần bổ sung bằng chứng"),
    DISPUTE_DEADLINE_WARNING("Sắp hết hạn tranh chấp"),
    DISPUTE_RESOLVED("Tranh chấp đã giải quyết"),

    // ===== WITHDRAWAL FLOW =====
    WITHDRAWAL_REQUESTED("Yêu cầu rút tiền mới"),
    WITHDRAWAL_APPROVED("Yêu cầu rút tiền đã duyệt"),
    WITHDRAWAL_REJECTED("Yêu cầu rút tiền bị từ chối"),
    WITHDRAWAL_COMPLETED("Đã chuyển khoản rút tiền"),

    // ===== VERIFICATION FLOW =====
    VERIFICATION_SUBMITTED("Hồ sơ xác thực mới"),
    VERIFICATION_APPROVED("Hồ sơ xác thực đã duyệt"),
    VERIFICATION_REJECTED("Hồ sơ xác thực bị từ chối"),

    // ===== OWNER REGISTRATION FLOW =====
    OWNER_REQUEST_SUBMITTED("Yêu cầu đăng ký chủ xe mới"),
    OWNER_REQUEST_APPROVED("Đăng ký chủ xe đã duyệt"),
    OWNER_REQUEST_REJECTED("Đăng ký chủ xe bị từ chối"),

    // ===== SYSTEM =====
    SYSTEM("Thông báo hệ thống"),
    SYSTEM_BROADCAST("Thông báo broadcast");

    private final String description;
}