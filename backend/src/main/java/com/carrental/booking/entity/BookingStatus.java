package com.carrental.booking.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BookingStatus {

    PENDING("Chờ thanh toán cọc", "pending_payment"),
    PAID("Đã cọc - Chờ chủ xe duyệt", "paid_pending_approval"),
    APPROVED("Chủ xe đã duyệt - Chờ nhận xe", "approved_pending_pickup"),
    RENTED("Đang thuê", "in_progress"),
    RETURNED("Đã trả xe - Chờ đánh giá", "returned_pending_review"),
    COMPLETED("Hoàn tất", "completed"),
    CANCELLED("Đã hủy", "cancelled");

    private final String description;
    private final String contractCode;

    @JsonCreator
    public static BookingStatus fromString(String val) {
        if (val == null || val.isBlank()) return null;
        String s = val.trim().toLowerCase();
        return switch (s) {
            case "pending", "pending_payment" -> PENDING;
            case "paid", "paid_pending_approval" -> PAID;
            case "approved", "approved_pending_pickup" -> APPROVED;
            case "rented", "in_progress" -> RENTED;
            case "returned", "returned_pending_review" -> RETURNED;
            case "completed" -> COMPLETED;
            case "cancelled", "canceled" -> CANCELLED;
            default -> {
                for (BookingStatus status : values()) {
                    if (status.name().equalsIgnoreCase(val)) {
                        yield status;
                    }
                }
                throw new IllegalArgumentException("Unknown BookingStatus: " + val);
            }
        };
    }
}