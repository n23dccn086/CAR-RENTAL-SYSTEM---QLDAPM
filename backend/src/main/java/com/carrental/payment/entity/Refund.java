package com.carrental.payment.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "refunds", indexes = {
        @Index(name = "idx_refunds_payment", columnList = "payment_id"),
        @Index(name = "idx_refunds_booking", columnList = "booking_id"),
        @Index(name = "idx_refunds_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Refund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "payment_id", nullable = false)
    Long paymentId;

    @Column(name = "booking_id", nullable = false)
    Long bookingId;

    @Column(nullable = false)
    Long amount;

    @Column(columnDefinition = "TEXT")
    String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "refund_transaction_id", length = 100)
    String refundTransactionId;

    @Column(name = "processed_at")
    LocalDateTime processedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;
}