package com.carrental.car.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CarStatus {

    PENDING("Chờ duyệt"),
    APPROVED("Đã duyệt - Chưa cho thuê"),
    AVAILABLE("Sẵn sàng cho thuê"),
    RENTED("Đang được thuê"),
    MAINTENANCE("Đang bảo dưỡng"),
    BROKEN("Bị hỏng"),
    INACTIVE("Ngừng hoạt động");

    private final String description;
}