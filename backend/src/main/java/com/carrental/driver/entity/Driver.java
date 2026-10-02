package com.carrental.driver.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "drivers", indexes = {
        @Index(name = "idx_drivers_owner", columnList = "owner_id"),
        @Index(name = "idx_drivers_phone", columnList = "phone"),
        @Index(name = "idx_drivers_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "owner_id", nullable = false)
    Long ownerId;

    @Column(nullable = false, length = 100)
    String name;

    @Column(nullable = false, unique = true, length = 15)
    String phone;

    @Column(length = 150)
    String email;

    @Column(length = 20)
    String cccd;

    @Column(name = "license_number", nullable = false, length = 30)
    String licenseNumber;

    @Column(name = "license_class", nullable = false, length = 10)
    String licenseClass;

    @Column(name = "license_expiry")
    LocalDate licenseExpiry;

    @Column(name = "date_of_birth")
    LocalDate dateOfBirth;

    @Column(length = 255)
    String address;

    @Column(name = "experience_years")
    @Builder.Default
    Integer experienceYears = 0;

    @Column(name = "avatar_url", length = 500)
    String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    DriverStatus status = DriverStatus.PENDING;

    @Column
    @Builder.Default
    Double rating = 0.0;

    @Column(name = "total_trips")
    @Builder.Default
    Integer totalTrips = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    LocalDateTime deletedAt;
}