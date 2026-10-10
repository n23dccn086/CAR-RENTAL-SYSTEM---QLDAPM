package com.carrental.car.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CarType {

    SEDAN("Sedan 4-5 chỗ"),
    SUV("SUV 5-7 chỗ"),
    MPV("MPV 7 chỗ"),
    HATCHBACK("Hatchback 4-5 chỗ"),
    PICKUP("Bán tải"),
    VAN("Van 9-16 chỗ"),
    LUXURY("Xe cao cấp");

    private final String description;

    @JsonCreator
    public static CarType fromString(String val) {
        if (val == null || val.isBlank()) return null;
        String s = val.trim().toUpperCase();
        return switch (s) {
            case "SEDAN" -> SEDAN;
            case "SUV" -> SUV;
            case "MPV" -> MPV;
            case "HATCHBACK" -> HATCHBACK;
            case "PICKUP", "BAN_TAI" -> PICKUP;
            case "VAN" -> VAN;
            case "LUXURY" -> LUXURY;
            default -> {
                for (CarType t : values()) {
                    if (t.name().equalsIgnoreCase(val.trim())) yield t;
                }
                yield SEDAN;
            }
        };
    }
}