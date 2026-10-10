package com.carrental.car.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cars", indexes = {
        @Index(name = "idx_cars_owner", columnList = "owner_id"),
        @Index(name = "idx_cars_plate", columnList = "plate"),
        @Index(name = "idx_cars_status", columnList = "status"),
        @Index(name = "idx_cars_car_type", columnList = "car_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Car {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "owner_id", nullable = false)
    Long ownerId;

    @Column(nullable = false, unique = true, length = 20)
    String plate;

    @Column(nullable = false, length = 50)
    String brand;

    @Column(nullable = false, length = 100)
    String model;

    @Column(nullable = false)
    Integer year;

    @Column(nullable = false)
    Integer seats;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    Transmission transmission;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", nullable = false, length = 20)
    FuelType fuelType;

    @Column(length = 30)
    String color;

    @Column(name = "current_km", nullable = false)
    @Builder.Default
    Integer currentKm = 0;

    @Column(name = "price_per_day", nullable = false)
    Long pricePerDay;

    @Column(name = "price_weekend")
    Long priceWeekend;

    @Column(name = "price_holiday")
    Long priceHoliday;

    @Column(name = "extra_km_price")
    @Builder.Default
    Long extraKmPrice = 5000L;

    @Column(name = "delivery_fee")
    @Builder.Default
    Long deliveryFee = 100000L;

    @Column(name = "cleaning_fee")
    @Builder.Default
    Long cleaningFee = 0L;

    @Column(name = "price_with_driver")
    Long priceWithDriver;

    @Column(name = "base_km_per_day")
    @Builder.Default
    Integer baseKmPerDay = 300;

    @Column(name = "deposit_percent")
    @Builder.Default
    Integer depositPercent = 30;

    @Column(name = "insurance_fee_per_day")
    @Builder.Default
    Long insuranceFeePerDay = 100000L;

    @Enumerated(EnumType.STRING)
    @Column(name = "car_type", nullable = false, length = 20)
    CarType carType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    CarStatus status = CarStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "rental_mode", nullable = false, length = 20)
    @Builder.Default
    RentalMode rentalMode = RentalMode.SELF_DRIVE;

    @Column(length = 255)
    String address;

    @Column(name = "delivery_radius")
    @Builder.Default
    Integer deliveryRadius = 20;

    @Column(columnDefinition = "TEXT")
    String description;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    LocalDateTime deletedAt;

    // ===== Quan hệ — 1 chiều, dùng @JoinColumn =====

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", referencedColumnName = "id", insertable = false, updatable = false)
    @Builder.Default
    List<CarImage> images = new ArrayList<>();

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", referencedColumnName = "id", insertable = false, updatable = false)
    @Builder.Default
    List<CarDocument> documents = new ArrayList<>();
}