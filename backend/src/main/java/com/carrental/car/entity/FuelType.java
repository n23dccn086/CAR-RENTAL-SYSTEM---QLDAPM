package com.carrental.car.entity;

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
}