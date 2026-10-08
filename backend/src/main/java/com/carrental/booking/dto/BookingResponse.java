package com.carrental.booking.dto;

import com.carrental.booking.entity.BookingStatus;
import com.carrental.car.entity.RentalMode;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookingResponse {

    Long id;
    Long customerId;
    Long carId;
    Long ownerId;

    String carName;
    String carPlate;
    String customerName;
    String ownerName;

    LocalDateTime startDate;
    LocalDateTime endDate;
    LocalDateTime actualReturnDate;

    String pickupAddress;
    String returnAddress;

    RentalMode rentalMode;
    Long driverId;

    Long totalPrice;
    Long depositAmount;
    Long remainingAmount;

    BookingStatus status;

    // ★ MỚI: % cọc đọc từ config
    Integer depositPercent;

    String customerNote;
    String ownerNote;
    String cancelReason;
    LocalDateTime cancelledAt;

    // ===== Chi tiết phí =====
    BookingDetailResponse details;

    // ===== Phí phát sinh (từ handover RETURN) =====
    Long lateFee;
    Long kmOverageFee;
    Long extraFees;
    Long totalExtraFees;
    Integer lateMinutes;
    Integer kmDriven;
    Integer kmAllowed;
    Integer kmOverage;
    String extraFeesNote;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}