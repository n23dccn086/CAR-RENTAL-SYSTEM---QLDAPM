package com.carrental.car.entity;

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
}