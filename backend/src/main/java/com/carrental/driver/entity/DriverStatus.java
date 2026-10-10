package com.carrental.driver.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DriverStatus {

    PENDING("Chờ duyệt"),
    ACTIVE("Đang hoạt động"),
    BUSY("Đang chạy chuyến"),
    INACTIVE("Tạm nghỉ"),
    REJECTED("Bị từ chối");

    private final String description;

    @com.fasterxml.jackson.annotation.JsonCreator
    public static DriverStatus fromString(String value) {
        if (value == null) return null;
        String clean = value.trim().toUpperCase();
        if ("AVAILABLE".equals(clean)) return ACTIVE;
        for (DriverStatus s : values()) {
            if (s.name().equalsIgnoreCase(clean)) return s;
        }
        return ACTIVE;
    }
}