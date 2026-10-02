package com.carrental.car.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Transmission {

    MANUAL("Số sàn"),
    AUTOMATIC("Số tự động");

    private final String description;
}