package com.carrental.payment.dto;

import com.carrental.payment.entity.PaymentStatus;
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
public class RefundResponse {
    Long id;
    Long paymentId;
    Long bookingId;
    Long amount;
    String reason;
    PaymentStatus status;
    String refundTransactionId;
    LocalDateTime processedAt;
    LocalDateTime createdAt;
}