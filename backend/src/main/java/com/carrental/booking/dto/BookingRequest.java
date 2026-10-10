package com.carrental.booking.dto;

import com.carrental.car.entity.RentalMode;
import com.fasterxml.jackson.annotation.JsonAlias;
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
    @JsonAlias({"car_id", "carId"})
    Long carId;

    @NotNull(message = "Ngày nhận xe không được để trống")
    @Future(message = "Ngày nhận xe phải trong tương lai")
    @JsonAlias({"start_datetime", "startDate", "start_date"})
    LocalDateTime startDate;

    @NotNull(message = "Ngày trả xe không được để trống")
    @Future(message = "Ngày trả xe phải trong tương lai")
    @JsonAlias({"end_datetime", "endDate", "end_date"})
    LocalDateTime endDate;

    @NotBlank(message = "Địa chỉ nhận xe không được để trống")
    @Size(max = 255, message = "Địa chỉ không quá 255 ký tự")
    @JsonAlias({"pickup_location", "pickupAddress", "pickup_address"})
    String pickupAddress;

    @Size(max = 255, message = "Địa chỉ không quá 255 ký tự")
    @JsonAlias({"dropoff_location", "returnAddress", "return_address"})
    String returnAddress;

    @NotNull(message = "Hình thức thuê không được để trống")
    @JsonAlias({"rental_type", "rentalMode", "rental_mode"})
    RentalMode rentalMode;

    @JsonAlias({"driver_id", "driverId"})
    Long driverId;

    @JsonAlias({"has_driver", "hasDriver"})
    Boolean hasDriver;

    @JsonAlias({"has_insurance", "hasInsurance", "insurance_selected"})
    Boolean hasInsurance;

    @JsonAlias({"delivery_required", "deliveryRequired"})
    Boolean deliveryRequired;

    @JsonAlias({"voucher_code", "voucherCode"})
    String voucherCode;

    @Size(max = 500, message = "Ghi chú không quá 500 ký tự")
    @JsonAlias({"customer_note", "customerNote", "note"})
    String customerNote;
}