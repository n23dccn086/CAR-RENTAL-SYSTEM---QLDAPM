package com.carrental.car.dto;

import com.carrental.car.entity.*;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CarResponse {

    Long id;
    Long ownerId;

    String plate;
    String brand;
    String model;
    Integer year;
    Integer seats;

    Transmission transmission;
    FuelType fuelType;
    String color;

    Integer currentKm;
    Long pricePerDay;
    Long priceWeekend;
    Long priceHoliday;

    Long extraKmPrice;
    Long deliveryFee;
    Long cleaningFee;

    CarType carType;
    CarStatus status;
    RentalMode rentalMode;

    String address;
    Integer deliveryRadius;
    String description;

    List<String> imageUrls;
    Integer imageCount;
    Integer documentCount;

    // ★ MỚI: Thống kê
    Double averageRating;    // Số sao trung bình (0-5)
    Long reviewCount;        // Số lượng đánh giá
    Long rentalCount;        // Số lượt thuê (COMPLETED)

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}