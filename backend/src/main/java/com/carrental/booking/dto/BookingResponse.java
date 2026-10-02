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

    String carName;                  // Tên xe (brand + model)
    String carPlate;                 // Biển số
    String customerName;             // Tên khách
    String ownerName;                // Tên chủ xe

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

    String customerNote;
    String ownerNote;
    String cancelReason;
    LocalDateTime cancelledAt;

    // Chi tiết phí
    BookingDetailResponse details;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}