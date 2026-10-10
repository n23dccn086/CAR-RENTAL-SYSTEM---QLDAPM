package com.carrental.payment.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PaymentMethod {

    MOMO("Ví Momo"),
    ZALOPAY("Ví ZaloPay"),
    VNPAY("Cổng VNPAY"),
    BANKING("Thẻ ngân hàng");

    private final String description;

    @com.fasterxml.jackson.annotation.JsonCreator
    public static PaymentMethod fromString(String value) {
        if (value == null || value.isBlank()) return null;
        for (PaymentMethod m : PaymentMethod.values()) {
            if (m.name().equalsIgnoreCase(value.trim())) {
                return m;
            }
        }
        return MOMO;
    }
}