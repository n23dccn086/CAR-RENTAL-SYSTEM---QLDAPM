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

    // ===== CONTRACT COMPATIBILITY (snake_case getters) =====

    public Long getPayment_id() {
        return id;
    }

    public Long getBooking_id() {
        return bookingId;
    }

    public Long getCustomer_id() {
        return customerId;
    }

    public String getTransaction_id() {
        return transactionId;
    }

    public String getPayment_url() {
        return paymentUrl;
    }

    public String getQr_code() {
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    }

    public LocalDateTime getExpires_at() {
        return createdAt != null ? createdAt.plusMinutes(15) : LocalDateTime.now().plusMinutes(15);
    }

    public String getPayment_type() {
        return paymentType != null ? paymentType.name().toLowerCase() : null;
    }

    public String getMethod() {
        return paymentMethod != null ? paymentMethod.name().toLowerCase() : null;
    }

    public LocalDateTime getPaid_at() {
        return paidAt;
    }

    public LocalDateTime getCreated_at() {
        return createdAt;
    }

    public LocalDateTime getUpdated_at() {
        return updatedAt;
    }
}