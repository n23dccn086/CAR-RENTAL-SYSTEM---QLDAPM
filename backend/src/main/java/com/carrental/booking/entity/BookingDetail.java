package com.carrental.booking.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "booking_details", indexes = {
        @Index(name = "idx_booking_details_booking", columnList = "booking_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "booking_id", nullable = false)
    Long bookingId;

    @Column(name = "rental_days", nullable = false)
    Integer rentalDays;

    @Column(name = "price_per_day", nullable = false)
    Long pricePerDay;

    @Column(name = "rental_fee", nullable = false)
    Long rentalFee;

    @Column(name = "delivery_fee")
    @Builder.Default
    Long deliveryFee = 0L;

    @Column(name = "insurance_fee")
    @Builder.Default
    Long insuranceFee = 0L;

    @Column(name = "driver_fee")
    @Builder.Default
    Long driverFee = 0L;

    @Column(name = "discount")
    @Builder.Default
    Long discount = 0L;

    @Column(name = "extra_fee")
    @Builder.Default
    Long extraFee = 0L;

    @Column(columnDefinition = "TEXT")
    String note;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;
}