package com.carrental.notification.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum NotificationType {

    BOOKING_NEW("Đơn đặt xe mới"),
    BOOKING_APPROVED("Đơn đã được duyệt"),
    BOOKING_REJECTED("Đơn bị từ chối"),
    BOOKING_CANCELLED("Đơn đã hủy"),
    PAYMENT_SUCCESS("Thanh toán thành công"),
    PAYMENT_FAILED("Thanh toán thất bại"),
    REFUND_SUCCESS("Hoàn tiền thành công"),
    CAR_APPROVED("Xe đã được duyệt"),
    CAR_REJECTED("Xe bị từ chối"),
    REVIEW_NEW("Đánh giá mới"),
    SYSTEM("Thông báo hệ thống");

    private final String description;
}