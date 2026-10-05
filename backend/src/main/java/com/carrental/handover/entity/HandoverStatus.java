package com.carrental.handover.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum HandoverStatus {

    PENDING("Chờ 2 bên ký"),
    SIGNED("Đã ký đủ 2 bên"),
    CANCELLED("Đã hủy");

    private final String description;
}