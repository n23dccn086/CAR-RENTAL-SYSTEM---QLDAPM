package com.carrental.payment.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PaymentType {

    DEPOSIT("Thanh toán cọc"),
    FULL("Thanh toán toàn bộ"),
    REMAINING("Thanh toán còn lại");

    private final String description;

    @com.fasterxml.jackson.annotation.JsonCreator
    public static PaymentType fromString(String value) {
        if (value == null || value.isBlank()) return null;
        for (PaymentType t : PaymentType.values()) {
            if (t.name().equalsIgnoreCase(value.trim())) {
                return t;
            }
        }
        return DEPOSIT;
    }
}