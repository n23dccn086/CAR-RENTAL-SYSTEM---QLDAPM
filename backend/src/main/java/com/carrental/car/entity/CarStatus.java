package com.carrental.car.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CarStatus {

    PENDING("Chờ duyệt"),
    AVAILABLE("Sẵn sàng"),
    RENTED("Đang được thuê"),
    MAINTENANCE("Bảo dưỡng"),
    BROKEN("Bị hỏng"),
    INACTIVE("Đã khóa"),
    REJECTED("Bị từ chối");

    private final String description;

    @JsonCreator
    public static CarStatus fromString(String val) {
        if (val == null || val.isBlank()) return null;
        String s = val.trim().toLowerCase();
        return switch (s) {
            case "pending", "cho_duyet" -> PENDING;
            case "available", "san_sang" -> AVAILABLE;
            case "rented", "dang_thue" -> RENTED;
            case "maintenance", "bao_duong" -> MAINTENANCE;
            case "broken", "hong" -> BROKEN;
            case "inactive", "da_khoa" -> INACTIVE;
            case "rejected", "tu_choi" -> REJECTED;
            default -> {
                for (CarStatus status : values()) {
                    if (status.name().equalsIgnoreCase(val.trim())) yield status;
                }
                yield AVAILABLE;
            }
        };
    }
}