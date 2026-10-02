package com.carrental.car.dto;

import com.carrental.car.entity.CarType;
import com.carrental.car.entity.FuelType;
import com.carrental.car.entity.RentalMode;
import com.carrental.car.entity.Transmission;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CarRequest {

    @NotBlank(message = "Biển số xe không được để trống")
    @Size(max = 20, message = "Biển số không quá 20 ký tự")
    String plate;

    @NotBlank(message = "Hãng xe không được để trống")
    @Size(max = 50, message = "Hãng xe không quá 50 ký tự")
    String brand;

    @NotBlank(message = "Dòng xe không được để trống")
    @Size(max = 100, message = "Dòng xe không quá 100 ký tự")
    String model;

    @NotNull(message = "Năm sản xuất không được để trống")
    @Min(value = 1990, message = "Năm sản xuất phải từ 1990 trở lên")
    @Max(value = 2100, message = "Năm sản xuất không hợp lệ")
    Integer year;

    @NotNull(message = "Số chỗ không được để trống")
    @Min(value = 2, message = "Số chỗ tối thiểu là 2")
    @Max(value = 30, message = "Số chỗ tối đa là 30")
    Integer seats;

    @NotNull(message = "Hộp số không được để trống")
    Transmission transmission;

    @NotNull(message = "Loại nhiên liệu không được để trống")
    FuelType fuelType;

    @Size(max = 30, message = "Màu sắc không quá 30 ký tự")
    String color;

    @Min(value = 0, message = "Số km không được âm")
    Integer currentKm;

    @NotNull(message = "Giá thuê ngày thường không được để trống")
    @Min(value = 0, message = "Giá thuê không được âm")
    Long pricePerDay;

    @Min(value = 0, message = "Giá cuối tuần không được âm")
    Long priceWeekend;

    @Min(value = 0, message = "Giá lễ không được âm")
    Long priceHoliday;

    @Min(value = 0, message = "Phụ phí vượt km không được âm")
    Long extraKmPrice;

    @Min(value = 0, message = "Phí giao xe không được âm")
    Long deliveryFee;

    @Min(value = 0, message = "Phí vệ sinh không được âm")
    Long cleaningFee;

    @NotNull(message = "Loại xe không được để trống")
    CarType carType;

    @NotNull(message = "Hình thức thuê không được để trống")
    RentalMode rentalMode;

    @Size(max = 255, message = "Địa chỉ không quá 255 ký tự")
    String address;

    @Min(value = 0, message = "Bán kính giao xe không được âm")
    Integer deliveryRadius;

    String description;
}