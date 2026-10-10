package com.carrental.handover.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

/**
 * Request DTO cho Contract 6.1: POST /handovers/pickup
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HandoverPickupRequest {

    @NotNull(message = "ID đơn không được để trống")
    @JsonAlias({"booking_id", "bookingId"})
    Long bookingId;

    @NotNull(message = "Số km không được để trống")
    @JsonAlias({"km_reading", "kmReading"})
    Integer kmReading;

    @JsonAlias({"fuel_level", "fuelLevel"})
    Short fuelLevel;

    @JsonAlias({"exterior_note", "exteriorNote"})
    String exteriorNote;

    @JsonAlias({"interior_note", "interiorNote"})
    String interiorNote;

    String damages;

    String signature;

    @JsonAlias({"image_urls", "imageUrls"})
    List<String> imageUrls;
}
