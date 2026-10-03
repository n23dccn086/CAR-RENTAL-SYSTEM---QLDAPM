package com.carrental.admin.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity: Yêu cầu rút tiền của chủ xe.
 */
@Entity
@Table(name = "withdrawals", indexes = {
        @Index(name = "idx_withdrawals_owner", columnList = "owner_id"),
        @Index(name = "idx_withdrawals_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Withdrawal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "owner_id", nullable = false)
    Long ownerId;

    @Column(nullable = false, precision = 12, scale = 0)
    BigDecimal amount;

    @Column(name = "bank_name", nullable = false, length = 100)
    String bankName;

    @Column(name = "bank_account", nullable = false, length = 50)
    String bankAccount;

    @Column(name = "account_holder", nullable = false, length = 100)
    String accountHolder;

    @Column(nullable = false, length = 20)
    @Builder.Default
    String status = "PENDING";  // PENDING, APPROVED, PROCESSING, COMPLETED, REJECTED

    @Column(name = "reject_reason", length = 255)
    String rejectReason;

    @Column(name = "processed_by")
    Long processedBy;

    @Column(name = "processed_at")
    LocalDateTime processedAt;

    @Column(name = "transaction_id", length = 100)
    String transactionId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    LocalDateTime deletedAt;
}