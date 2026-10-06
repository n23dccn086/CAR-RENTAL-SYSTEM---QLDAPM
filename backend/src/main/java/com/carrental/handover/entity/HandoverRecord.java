package com.carrental.handover.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity: Biên bản giao/nhận xe.
 */
@Entity
@Table(name = "handover_records", indexes = {
        @Index(name = "idx_handover_booking", columnList = "booking_id"),
        @Index(name = "idx_handover_type", columnList = "handover_type"),
        @Index(name = "idx_handover_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HandoverRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "booking_id", nullable = false)
    Long bookingId;

    @Column(name = "handover_type", nullable = false, length = 20)
    String handoverType;         // PICKUP, RETURN

    @Column(name = "km_reading")
    Integer kmReading;

    @Column(name = "fuel_level")
    Short fuelLevel;

    @Column(name = "exterior_note", columnDefinition = "TEXT")
    String exteriorNote;

    @Column(name = "interior_note", columnDefinition = "TEXT")
    String interiorNote;

    @Column(columnDefinition = "TEXT")
    String damages;              // JSON string

    @Column(name = "extra_fees", precision = 12, scale = 0)
    @Builder.Default
    BigDecimal extraFees = BigDecimal.ZERO;

    @Column(name = "extra_fees_note", columnDefinition = "TEXT")
    String extraFeesNote;

// ===== UC-C12: Phí vượt giờ (chỉ RETURN) =====
    @Column(name = "actual_return_time")
    LocalDateTime actualReturnTime;

    @Column(name = "late_fee", precision = 12, scale = 0)
    @Builder.Default
    BigDecimal lateFee = BigDecimal.ZERO;

    @Column(name = "late_minutes")
    @Builder.Default
    Integer lateMinutes = 0;

    // ===== Chữ ký (lưu URL ảnh) =====
    @Column(name = "owner_signature", columnDefinition = "TEXT")
    String ownerSignature;

    @Column(name = "customer_signature", columnDefinition = "TEXT")
    String customerSignature;

    @Column(name = "owner_signed_at")
    LocalDateTime ownerSignedAt;

    @Column(name = "customer_signed_at")
    LocalDateTime customerSignedAt;

    // ===== Trạng thái biên bản =====
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    HandoverStatus status = HandoverStatus.PENDING;

    @Column(name = "record_hash", length = 64)
    String recordHash;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    LocalDateTime deletedAt;
}