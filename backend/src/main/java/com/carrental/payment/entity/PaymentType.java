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
}