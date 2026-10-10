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

    // ===== CONTRACT COMPATIBILITY (snake_case getters) =====

    public Long getHandover_id() {
        return id;
    }

    public Long getBooking_id() {
        return bookingId;
    }

    public String getHandover_type() {
        return handoverType != null ? handoverType.toLowerCase() : null;
    }

    public Integer getKm_reading() {
        return kmReading;
    }

    public Short getFuel_level() {
        return fuelLevel;
    }

    public String getExterior_note() {
        return exteriorNote;
    }

    public String getInterior_note() {
        return interiorNote;
    }

    public BigDecimal getExtra_fees() {
        return extraFees != null ? extraFees : BigDecimal.ZERO;
    }

    public String getExtra_fees_note() {
        return extraFeesNote;
    }

    public BigDecimal getLate_fee() {
        return lateFee != null ? lateFee : BigDecimal.ZERO;
    }

    public Integer getLate_minutes() {
        return lateMinutes != null ? lateMinutes : 0;
    }

    public Integer getOverage_km() {
        return kmOverage != null ? kmOverage : 0;
    }

    public BigDecimal getOverage_km_fee() {
        return kmOverageFee != null ? kmOverageFee : BigDecimal.ZERO;
    }

    public BigDecimal getTotal_extra() {
        BigDecimal total = BigDecimal.ZERO;
        if (kmOverageFee != null) total = total.add(kmOverageFee);
        if (lateFee != null) total = total.add(lateFee);
        if (extraFees != null) total = total.add(extraFees);
        return total;
    }

    public String getOwner_signature() {
        return ownerSignature;
    }

    public String getCustomer_signature() {
        return customerSignature;
    }

    public LocalDateTime getOwner_signed_at() {
        return ownerSignedAt;
    }

    public LocalDateTime getCustomer_signed_at() {
        return customerSignedAt;
    }

    public String getRecord_hash() {
        return recordHash;
    }

    public LocalDateTime getCreated_at() {
        return createdAt;
    }

    public LocalDateTime getUpdated_at() {
        return updatedAt;
    }

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