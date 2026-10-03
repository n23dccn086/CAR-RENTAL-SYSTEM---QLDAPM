package com.carrental.admin.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity: Log duyệt hồ sơ (user, car, driver).
 */
@Entity
@Table(name = "approval_logs", indexes = {
        @Index(name = "idx_approval_target", columnList = "target_type, target_id"),
        @Index(name = "idx_approval_approved_by", columnList = "approved_by")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ApprovalLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "target_type", nullable = false, length = 30)
    String targetType;       // USER_DOCUMENT, CAR, CAR_DOCUMENT, DRIVER

    @Column(name = "target_id", nullable = false)
    Long targetId;

    @Column(nullable = false, length = 20)
    String action;           // APPROVE, REJECT, REQUEST_MORE

    @Column(columnDefinition = "TEXT")
    String reason;

    @Column(name = "approved_by", nullable = false)
    Long approvedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;
}