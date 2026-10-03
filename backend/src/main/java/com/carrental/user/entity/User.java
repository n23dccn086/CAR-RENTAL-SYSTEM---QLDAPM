package com.carrental.user.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_phone", columnList = "phone"),
        @Index(name = "idx_users_role", columnList = "role"),
        @Index(name = "idx_users_verification_status", columnList = "verification_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, length = 100)
    String name;

    @Column(nullable = false, unique = true, length = 15)
    String phone;

    @Column(unique = true, length = 150)
    String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    Role role = Role.CUSTOMER;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", length = 20)
    @Builder.Default
    VerificationStatus verificationStatus = VerificationStatus.UNVERIFIED;

    @Column(length = 255)
    String address;

    @Column(name = "date_of_birth")
    LocalDate dateOfBirth;

    // ===== MỚI THÊM — Cho Admin quản lý user =====

    @Column(name = "avatar_url", length = 500)
    String avatarUrl;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    String rejectionReason;

    @Column(name = "last_login_at")
    LocalDateTime lastLoginAt;

    @Column(name = "is_active")
    @Builder.Default
    Boolean isActive = true;

    // ============================================

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    LocalDateTime deletedAt;
}