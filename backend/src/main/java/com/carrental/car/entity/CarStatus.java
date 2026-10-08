package com.carrental.car.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum CarStatus {

    PENDING("Chờ duyệt"),
    AVAILABLE("Sẵn sàng"),
    RENTED("Đang được thuê"),
    MAINTENANCE("Bảo dưỡng"),
    BROKEN("Bị hỏng"),
    INACTIVE("Đã khóa"),
    REJECTED("Bị từ chối");

    private final String description;
}