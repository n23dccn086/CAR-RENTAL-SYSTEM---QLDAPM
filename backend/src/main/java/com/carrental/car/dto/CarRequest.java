package com.carrental.car.dto;

import com.carrental.car.entity.CarType;
import com.carrental.car.entity.FuelType;
import com.carrental.car.entity.RentalMode;
import com.carrental.car.entity.Transmission;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CarRequest {

    @NotBlank(message = "Biển số xe không được để trống")
    @Size(max = 20, message = "Biển số không quá 20 ký tự")
    @JsonAlias({"plate", "plate_number", "plateNumber"})
    String plate;

    @NotBlank(message = "Hãng xe không được để trống")
    @Size(max = 50, message = "Hãng xe không quá 50 ký tự")
    @JsonAlias({"brand"})
    String brand;

    @NotBlank(message = "Dòng xe không được để trống")
    @Size(max = 100, message = "Dòng xe không quá 100 ký tự")
    @JsonAlias({"model"})
    String model;

    @NotNull(message = "Năm sản xuất không được để trống")
    @Min(value = 1990, message = "Năm sản xuất phải từ 1990 trở lên")
    @Max(value = 2100, message = "Năm sản xuất không hợp lệ")
    @JsonAlias({"year"})
    Integer year;

    @NotNull(message = "Số chỗ không được để trống")
    @Min(value = 2, message = "Số chỗ tối thiểu là 2")
    @Max(value = 30, message = "Số chỗ tối đa là 30")
    @JsonAlias({"seats"})
    Integer seats;

    @NotNull(message = "Hộp số không được để trống")
    @JsonAlias({"transmission"})
    Transmission transmission;

    @NotNull(message = "Loại nhiên liệu không được để trống")
    @JsonAlias({"fuelType", "fuel_type"})
    FuelType fuelType;

    @Size(max = 30, message = "Màu sắc không quá 30 ký tự")
    @JsonAlias({"color"})
    String color;

    @Min(value = 0, message = "Số km không được âm")
    @JsonAlias({"currentKm", "current_km"})
    Integer currentKm;

    @Min(value = 0, message = "Giá thuê không được âm")
    @JsonAlias({"pricePerDay", "price_per_day"})
    Long pricePerDay;

    @Min(value = 0, message = "Giá cuối tuần không được âm")
    @JsonAlias({"priceWeekend", "price_weekend"})
    Long priceWeekend;

    @Min(value = 0, message = "Giá lễ không được âm")
    @JsonAlias({"priceHoliday", "price_holiday"})
    Long priceHoliday;

    @Min(value = 0, message = "Giá có tài xế không được âm")
    @JsonAlias({"priceWithDriver", "price_with_driver"})
    Long priceWithDriver;

    @Min(value = 0, message = "Phụ phí vượt km không được âm")
    @JsonAlias({"extraKmPrice", "extra_km_price", "overage_km_price"})
    Long extraKmPrice;

    @Min(value = 0, message = "Phí giao xe không được âm")
    @JsonAlias({"deliveryFee", "delivery_fee", "delivery_fee_per_km"})
    Long deliveryFee;

    @Min(value = 0, message = "Phí vệ sinh không được âm")
    @JsonAlias({"cleaningFee", "cleaning_fee"})
    Long cleaningFee;

    @JsonAlias({"carType", "car_type"})
    CarType carType;

    @JsonAlias({"rentalMode", "rental_mode", "rental_type"})
    RentalMode rentalMode;

    @Size(max = 255, message = "Địa chỉ không quá 255 ký tự")
    @JsonAlias({"address", "location"})
    String address;

    @Min(value = 0, message = "Bán kính giao xe không được âm")
    @JsonAlias({"deliveryRadius", "delivery_radius", "delivery_radius_km"})
    Integer deliveryRadius;

    @JsonAlias({"description"})
    String description;

    @JsonAlias({"features"})
    List<String> features;

    @JsonAlias({"latitude"})
    Double latitude;

    @JsonAlias({"longitude"})
    Double longitude;
}