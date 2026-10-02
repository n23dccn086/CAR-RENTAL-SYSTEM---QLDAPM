package com.carrental.booking.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BookingStatus {

    PENDING("Chờ thanh toán cọc"),
    PAID("Đã cọc - Chờ chủ xe duyệt"),
    APPROVED("Chủ xe đã duyệt - Chờ nhận xe"),
    RENTED("Đang thuê"),
    RETURNED("Đã trả xe - Chờ đánh giá"),
    COMPLETED("Hoàn tất"),
    CANCELLED("Đã hủy");

    private final String description;
}