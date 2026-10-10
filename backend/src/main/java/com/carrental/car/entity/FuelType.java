package com.carrental.car.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum FuelType {

    GASOLINE("Xăng"),
    DIESEL("Dầu diesel"),
    ELECTRIC("Điện"),
    HYBRID("Hybrid");

    private final String description;

    @JsonCreator
    public static FuelType fromString(String val) {
        if (val == null || val.isBlank()) return null;
        String s = val.trim().toLowerCase();
        return switch (s) {
            case "gasoline", "xang" -> GASOLINE;
            case "diesel", "dau", "dau_diesel" -> DIESEL;
            case "electric", "dien" -> ELECTRIC;
            case "hybrid" -> HYBRID;
            default -> {
                for (FuelType f : values()) {
                    if (f.name().equalsIgnoreCase(val.trim())) yield f;
                }
                yield GASOLINE;
            }
        };
    }
}