package com.carrental.driver.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity: Phân công tài xế cho đơn đặt xe.
 * Dùng cho luồng auto-assign tài xế.
 */
@Entity
@Table(name = "driver_assignments", indexes = {
        @Index(name = "idx_assignment_booking", columnList = "booking_id"),
        @Index(name = "idx_assignment_driver", columnList = "driver_id"),
        @Index(name = "idx_assignment_status", columnList = "status"),
        @Index(name = "idx_assignment_token", columnList = "token"),
        @Index(name = "idx_assignment_status_deadline", columnList = "status, deadline_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DriverAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "booking_id", nullable = false)
    Long bookingId;

    @Column(name = "driver_id", nullable = false)
    Long driverId;

    @Column(nullable = false, unique = true, length = 64)
    String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    AssignmentStatus status = AssignmentStatus.PENDING;

    @Column(name = "reject_reason", length = 255)
    String rejectReason;

    @Column(name = "deadline_at", nullable = false)
    LocalDateTime deadlineAt;

    @Column(name = "responded_at")
    LocalDateTime respondedAt;

    @Column(name = "attempt_number")
    @Builder.Default
    Integer attemptNumber = 1;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
}