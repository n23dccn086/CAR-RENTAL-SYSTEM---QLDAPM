package com.carrental.payment.dto;

import com.carrental.payment.entity.PaymentMethod;
import com.carrental.payment.entity.PaymentStatus;
import com.carrental.payment.entity.PaymentType;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaymentResponse {

    Long id;
    Long bookingId;
    Long customerId;

    String customerName;
    String bookingCode;

    Long amount;
    PaymentMethod paymentMethod;
    PaymentType paymentType;
    PaymentStatus status;

    String transactionId;
    String gatewayTransactionId;
    String paymentUrl;
    String gatewayResponse;

    LocalDateTime paidAt;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}