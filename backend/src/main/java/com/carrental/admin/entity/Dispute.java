package com.carrental.admin.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity: Tranh chấp giữa khách thuê và chủ xe.
 */
@Entity
@Table(name = "disputes", indexes = {
        @Index(name = "idx_disputes_booking", columnList = "booking_id"),
        @Index(name = "idx_disputes_status", columnList = "status"),
        @Index(name = "idx_disputes_raised_by", columnList = "raised_by")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Dispute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "dispute_code", nullable = false, unique = true, length = 20)
    String disputeCode;

    @Column(name = "booking_id", nullable = false)
    Long bookingId;

    @Column(name = "raised_by", nullable = false)
    Long raisedBy;

    @Column(name = "against_user", nullable = false)
    Long againstUser;

    @Column(nullable = false, length = 30)
    String category; // damage, late_return, overage_km, no_show, payment, behavior, other

    @Column(nullable = false, columnDefinition = "TEXT")
    String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    String evidence; 

    @Column(name = "claimed_amount", precision = 12, scale = 0)
    BigDecimal claimedAmount;

    @Column(nullable = false, length = 20)
    @Builder.Default
    String status = "PENDING"; // PENDING, INVESTIGATING, WAITING_EVIDENCE, RESOLVED, ESCALATED, CLOSED

    @Column(columnDefinition = "TEXT")
    String resolution;

    @Column(name = "resolved_amount", precision = 12, scale = 0)
    BigDecimal resolvedAmount;

    @Column(name = "resolved_by")
    Long resolvedBy;

    @Column(name = "resolved_at")
    LocalDateTime resolvedAt;

    @Column(name = "deadline_at")
    LocalDateTime deadlineAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    LocalDateTime deletedAt;
}