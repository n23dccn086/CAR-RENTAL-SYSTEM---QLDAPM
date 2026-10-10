package com.carrental.car.dto;

import com.carrental.car.entity.*;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CarResponse {

    Long id;
    Long ownerId;
    String ownerName;
    String ownerPhone;
    String ownerAvatarUrl;

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
    Long priceWithDriver;

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

    // ★ Thống kê
    Double averageRating;
    Long reviewCount;
    Long rentalCount;

    // ★ Blocked dates & reviews (khi xem chi tiết 3.2)
    List<Map<String, Object>> blockedDates;
    List<Map<String, Object>> reviews;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    // ===== CONTRACT ALIASES & COMPATIBILITY GETTERS =====

    @JsonProperty("plate_number")
    public String getPlateNumber() {
        return plate;
    }

    @JsonProperty("location")
    public String getLocation() {
        return address;
    }

    @JsonProperty("current_km")
    public Integer getCurrentKmSnake() {
        return currentKm;
    }

    @JsonProperty("price_per_day")
    public Long getPricePerDaySnake() {
        return pricePerDay;
    }

    @JsonProperty("price_weekend")
    public Long getPriceWeekendSnake() {
        return priceWeekend != null ? priceWeekend : pricePerDay;
    }

    @JsonProperty("price_holiday")
    public Long getPriceHolidaySnake() {
        return priceHoliday != null ? priceHoliday : pricePerDay;
    }

    @JsonProperty("delivery_radius_km")
    public Integer getDeliveryRadiusKm() {
        return deliveryRadius;
    }

    @JsonProperty("rental_type")
    public String getRentalType() {
        return rentalMode != null ? rentalMode.name().toLowerCase() : "both";
    }

    @JsonProperty("avg_rating")
    public Double getAvgRating() {
        return averageRating != null ? averageRating : 5.0;
    }

    @JsonProperty("total_reviews")
    public Long getTotalReviews() {
        return reviewCount != null ? reviewCount : 0L;
    }

    @JsonProperty("total_bookings")
    public Long getTotalBookings() {
        return rentalCount != null ? rentalCount : 0L;
    }

    @JsonProperty("thumbnail")
    public String getThumbnail() {
        return (imageUrls != null && !imageUrls.isEmpty()) ? imageUrls.get(0) : null;
    }

    @JsonProperty("images")
    public List<Map<String, Object>> getImagesList() {
        if (imageUrls == null || imageUrls.isEmpty()) return List.of();
        List<Map<String, Object>> list = new ArrayList<>();
        for (int i = 0; i < imageUrls.size(); i++) {
            Map<String, Object> img = new LinkedHashMap<>();
            img.put("id", (long) (i + 1));
            img.put("image_url", imageUrls.get(i));
            img.put("image_type", i == 0 ? "front" : (i == 1 ? "interior" : "other"));
            list.add(img);
        }
        return list;
    }

    @JsonProperty("pricing")
    public Map<String, Object> getPricing() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("price_per_day", pricePerDay != null ? pricePerDay : 0L);
        map.put("price_weekend", priceWeekend != null ? priceWeekend : pricePerDay);
        map.put("price_holiday", priceHoliday != null ? priceHoliday : pricePerDay);
        map.put("price_with_driver", priceWithDriver != null ? priceWithDriver : ((pricePerDay != null ? pricePerDay : 0L) + 500000L));
        map.put("base_km_per_day", 300);
        map.put("overage_km_price", extraKmPrice != null ? extraKmPrice : 5000L);
        map.put("delivery_fee_per_km", deliveryFee != null ? deliveryFee : 10000L);
        map.put("insurance_fee_per_day", 100000L);
        map.put("deposit_percent", 30);
        return map;
    }

    @JsonProperty("owner")
    public Map<String, Object> getOwner() {
        if (ownerId == null) return null;
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", ownerId);
        map.put("name", ownerName != null ? ownerName : "Chủ xe");
        if (ownerPhone != null) map.put("phone", ownerPhone);
        if (ownerAvatarUrl != null) map.put("avatar_url", ownerAvatarUrl);
        map.put("avg_rating", 4.9);
        return map;
    }

    @JsonProperty("blocked_dates")
    public List<Map<String, Object>> getBlockedDatesList() {
        return blockedDates != null ? blockedDates : List.of();
    }
}