package com.carrental.payment.dto;

import com.carrental.payment.entity.PaymentMethod;
import com.carrental.payment.entity.PaymentType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentRequest {

    @NotNull(message = "ID booking không được để trống")
    @com.fasterxml.jackson.annotation.JsonAlias({"booking_id", "bookingId"})
    Long bookingId;

    @NotNull(message = "Số tiền không được để trống")
    @Positive(message = "Số tiền phải lớn hơn 0")
    Long amount;

    @NotNull(message = "Phương thức thanh toán không được để trống")
    @com.fasterxml.jackson.annotation.JsonAlias({"method", "paymentMethod", "payment_method"})
    PaymentMethod paymentMethod;

    @NotNull(message = "Loại thanh toán không được để trống")
    @com.fasterxml.jackson.annotation.JsonAlias({"payment_type", "paymentType"})
    PaymentType paymentType;

    @com.fasterxml.jackson.annotation.JsonAlias({"return_url", "returnUrl"})
    String returnUrl;
}