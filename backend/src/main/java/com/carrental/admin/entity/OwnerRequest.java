package com.carrental.admin.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "owner_requests", indexes = {
        @Index(name = "idx_owner_req_user", columnList = "user_id"),
        @Index(name = "idx_owner_req_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OwnerRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "user_id", nullable = false)
    Long userId;

    // ===== Bước 1: Thông tin cá nhân =====
    @Column(name = "full_name", nullable = false, length = 100)
    String fullName;

    @Column(name = "date_of_birth", nullable = false)
    LocalDate dateOfBirth;

    @Column(nullable = false, length = 10)
    String gender;

    @Column(nullable = false, length = 255)
    String address;

    @Column(nullable = false, length = 12)
    String cccd;

    @Column(name = "cccd_issued_date", nullable = false)
    LocalDate cccdIssuedDate;

    @Column(name = "cccd_issued_place", nullable = false, length = 100)
    String cccdIssuedPlace;

    // ===== Bước 2: Ngân hàng =====
    @Column(name = "bank_name", nullable = false, length = 100)
    String bankName;

    @Column(name = "bank_account", nullable = false, length = 50)
    String bankAccount;

    @Column(name = "account_holder", nullable = false, length = 100)
    String accountHolder;

    // ===== Status =====
    @Column(nullable = false, length = 20)
    @Builder.Default
    String status = "PENDING";

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    String rejectionReason;

    @Column(name = "processed_by")
    Long processedBy;

    @Column(name = "processed_at")
    LocalDateTime processedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    LocalDateTime deletedAt;
}