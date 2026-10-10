package com.carrental.car.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum RentalMode {

    SELF_DRIVE("Tự lái"),
    WITH_DRIVER("Có tài xế"),
    BOTH("Cả hai");

    private final String description;

    @com.fasterxml.jackson.annotation.JsonCreator
    public static RentalMode fromString(String value) {
        if (value == null) return null;
        String normalized = value.trim().toUpperCase().replace("-", "_");
        for (RentalMode mode : values()) {
            if (mode.name().equals(normalized)) return mode;
        }
        return SELF_DRIVE;
    }
}