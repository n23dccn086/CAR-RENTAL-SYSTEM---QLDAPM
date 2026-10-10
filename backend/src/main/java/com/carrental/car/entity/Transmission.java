package com.carrental.car.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Transmission {

    MANUAL("Số sàn"),
    AUTOMATIC("Số tự động");

    private final String description;

    @JsonCreator
    public static Transmission fromString(String val) {
        if (val == null || val.isBlank()) return null;
        String s = val.trim().toLowerCase();
        return switch (s) {
            case "manual", "so_san" -> MANUAL;
            case "automatic", "tu_dong", "auto" -> AUTOMATIC;
            default -> {
                for (Transmission t : values()) {
                    if (t.name().equalsIgnoreCase(val.trim())) yield t;
                }
                yield AUTOMATIC;
            }
        };
    }
}