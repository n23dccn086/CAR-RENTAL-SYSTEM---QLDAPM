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
}