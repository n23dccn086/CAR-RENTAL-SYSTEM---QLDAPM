package com.carrental.handover.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class HandoverResponse {

    Long id;
    Long bookingId;
    String handoverType;

    Integer kmReading;
    Short fuelLevel;
    String exteriorNote;
    String interiorNote;
    String damages;
    BigDecimal extraFees;
    String extraFeesNote;

    // ===== UC-C12: Phí vượt giờ =====
    LocalDateTime actualReturnTime;
    BigDecimal lateFee;
    Integer lateMinutes;
    String lateFeeBreakdown;

    // ===== ★ MỚI UC-C13: Phí vượt km =====
    Integer kmDriven;
    Integer kmAllowed;
    Integer kmOverage;
    BigDecimal kmOverageFee;
    String kmOverageBreakdown;

    String ownerSignature;
    String customerSignature;
    LocalDateTime ownerSignedAt;
    LocalDateTime customerSignedAt;

    String status;
    String bookingStatus;

    Integer pickupKmReading;

    Boolean canSign;
    Boolean canCreate;

    String recordHash;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    List<ImageResponse> images;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ImageResponse {
        Long id;
        String imageUrl;
        String imageType;
        String note;
    }
}