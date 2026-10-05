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
    String handoverType;         // PICKUP, RETURN

    Integer kmReading;
    Short fuelLevel;
    String exteriorNote;
    String interiorNote;
    String damages;
    BigDecimal extraFees;
    String extraFeesNote;

    String ownerSignature;
    String customerSignature;
    LocalDateTime ownerSignedAt;
    LocalDateTime customerSignedAt;

    // ===== Trạng thái =====
    String status;               // PENDING, SIGNED, CANCELLED
    String bookingStatus;        // Trạng thái booking hiện tại

    // ===== Thông tin để so sánh (chỉ có khi RETURN) =====
    Integer pickupKmReading;     // Km lúc PICKUP
    Integer kmDriven;            // Số km đã chạy

    // ===== Quyền của user hiện tại =====
    Boolean canSign;             // User hiện tại có được ký không
    Boolean canCreate;           // User hiện tại có được tạo không

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