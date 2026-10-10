package com.carrental.payment.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PaymentStatus {

    PENDING("Chờ thanh toán"),
    SUCCESS("Thanh toán thành công"),
    FAILED("Thanh toán thất bại"),
    CANCELLED("Đã hủy"),
    REFUNDED("Đã hoàn tiền");

    private final String description;

    @com.fasterxml.jackson.annotation.JsonCreator
    public static PaymentStatus fromString(String value) {
        if (value == null || value.isBlank()) return null;
        for (PaymentStatus s : PaymentStatus.values()) {
            if (s.name().equalsIgnoreCase(value.trim())) {
                return s;
            }
        }
        return PENDING;
    }
}