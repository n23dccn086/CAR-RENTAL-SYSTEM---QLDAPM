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
}