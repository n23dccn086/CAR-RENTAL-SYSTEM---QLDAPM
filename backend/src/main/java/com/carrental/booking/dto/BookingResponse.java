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

    String customerNote;
    String ownerNote;
    String cancelReason;
    LocalDateTime cancelledAt;

    // ===== Chi tiết phí =====
    BookingDetailResponse details;

    // ===== Phí phát sinh (từ handover RETURN) =====
    Long lateFee;              // Phí trả muộn
    Long kmOverageFee;         // ★ MỚI: Phí vượt km
    Long extraFees;            // Phí phát sinh khác (vệ sinh, xăng...)
    Long totalExtraFees;       // Tổng = lateFee + kmOverageFee + extraFees
    Integer lateMinutes;       // Số phút trả muộn
    Integer kmDriven;          // ★ MỚI: Số km đã chạy
    Integer kmAllowed;         // ★ MỚI: Số km được phép
    Integer kmOverage;         // ★ MỚI: Số km vượt
    String extraFeesNote;      // Ghi chú phí phát sinh

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}