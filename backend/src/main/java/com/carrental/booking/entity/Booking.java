package com.carrental.booking.entity;

import com.carrental.car.entity.RentalMode;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookings", indexes = {
        @Index(name = "idx_bookings_customer", columnList = "customer_id"),
        @Index(name = "idx_bookings_car", columnList = "car_id"),
        @Index(name = "idx_bookings_owner", columnList = "owner_id"),
        @Index(name = "idx_bookings_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "customer_id", nullable = false)
    Long customerId;

    @Column(name = "car_id", nullable = false)
    Long carId;

    @Column(name = "owner_id", nullable = false)
    Long ownerId;

    @Column(name = "start_date", nullable = false)
    LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    LocalDateTime endDate;

    @Column(name = "actual_return_date")
    LocalDateTime actualReturnDate;

    @Column(name = "pickup_address", length = 255)
    String pickupAddress;

    @Column(name = "return_address", length = 255)
    String returnAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "rental_mode", nullable = false, length = 20)
    @Builder.Default
    RentalMode rentalMode = RentalMode.SELF_DRIVE;

    @Column(name = "driver_id")
    Long driverId;

    @Column(name = "total_price", nullable = false)
    Long totalPrice;

    @Column(name = "deposit_amount", nullable = false)
    Long depositAmount;

    @Column(name = "remaining_amount", nullable = false)
    Long remainingAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    BookingStatus status = BookingStatus.PENDING;

    @Column(name = "customer_note", columnDefinition = "TEXT")
    String customerNote;

    @Column(name = "owner_note", columnDefinition = "TEXT")
    String ownerNote;

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    String cancelReason;

    @Column(name = "cancelled_at")
    LocalDateTime cancelledAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
}