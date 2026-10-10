package com.carrental.handover.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Request DTO tạo biên bản giao/nhận xe.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HandoverRequest {

    @NotNull(message = "ID đơn không được để trống")
    @com.fasterxml.jackson.annotation.JsonAlias({"booking_id", "bookingId"})
    Long bookingId;

    @NotBlank(message = "Loại biên bản không được để trống")
    @com.fasterxml.jackson.annotation.JsonAlias({"handover_type", "handoverType"})
    String handoverType;        // PICKUP, RETURN

    @com.fasterxml.jackson.annotation.JsonAlias({"km_reading", "kmReading"})
    Integer kmReading;

    @com.fasterxml.jackson.annotation.JsonAlias({"fuel_level", "fuelLevel"})
    Short fuelLevel;

    @com.fasterxml.jackson.annotation.JsonAlias({"exterior_note", "exteriorNote"})
    String exteriorNote;

    @com.fasterxml.jackson.annotation.JsonAlias({"interior_note", "interiorNote"})
    String interiorNote;

    String damages;

    @com.fasterxml.jackson.annotation.JsonAlias({"extra_fees", "extraFees"})
    BigDecimal extraFees;

    @com.fasterxml.jackson.annotation.JsonAlias({"extra_fees_note", "extraFeesNote"})
    String extraFeesNote;

    @com.fasterxml.jackson.annotation.JsonAlias({"actual_return_time", "actualReturnTime"})
    LocalDateTime actualReturnTime;

    @com.fasterxml.jackson.annotation.JsonAlias({"signature", "signatureUrl", "signature_url"})
    String signature;

    List<HandoverImageRequest> images;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class HandoverImageRequest {
        @com.fasterxml.jackson.annotation.JsonAlias({"image_url", "imageUrl"})
        String imageUrl;
        @com.fasterxml.jackson.annotation.JsonAlias({"image_type", "imageType"})
        String imageType;
        String note;
    }
}