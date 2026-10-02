package com.carrental.driver.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DriverStatus {

    PENDING("Chờ duyệt"),
    ACTIVE("Đang hoạt động"),
    BUSY("Đang chạy chuyến"),
    INACTIVE("Tạm nghỉ"),
    REJECTED("Bị từ chối");

    private final String description;
}