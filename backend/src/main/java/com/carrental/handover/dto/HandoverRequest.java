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
    Long bookingId;

    @NotBlank(message = "Loại biên bản không được để trống")
    String handoverType;        // PICKUP, RETURN

    Integer kmReading;
    Short fuelLevel;
    String exteriorNote;
    String interiorNote;
    String damages;
    BigDecimal extraFees;
    String extraFeesNote;
    LocalDateTime actualReturnTime;

    List<HandoverImageRequest> images;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class HandoverImageRequest {
        String imageUrl;
        String imageType;
        String note;
    }
}