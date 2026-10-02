package com.carrental.booking.dto;

import com.carrental.car.entity.RentalMode;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BookingRequest {

    @NotNull(message = "ID xe không được để trống")
    Long carId;

    @NotNull(message = "Ngày nhận xe không được để trống")
    @Future(message = "Ngày nhận xe phải trong tương lai")
    LocalDateTime startDate;

    @NotNull(message = "Ngày trả xe không được để trống")
    @Future(message = "Ngày trả xe phải trong tương lai")
    LocalDateTime endDate;

    @NotBlank(message = "Địa chỉ nhận xe không được để trống")
    @Size(max = 255, message = "Địa chỉ không quá 255 ký tự")
    String pickupAddress;

    @Size(max = 255, message = "Địa chỉ không quá 255 ký tự")
    String returnAddress;

    @NotNull(message = "Hình thức thuê không được để trống")
    RentalMode rentalMode;

    Boolean hasDriver;              // Có thuê tài xế không

    Boolean hasInsurance;           // Có mua bảo hiểm không

    Boolean deliveryRequired;       // Có giao xe tận nơi không

    @Size(max = 500, message = "Ghi chú không quá 500 ký tự")
    String customerNote;
}