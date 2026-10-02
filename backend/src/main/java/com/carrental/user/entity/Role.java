package com.carrental.user.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Role {

    CUSTOMER("Khách thuê xe"),
    OWNER("Chủ xe / Đơn vị cho thuê"),
    DRIVER("Tài xế"),
    ADMIN("Quản trị viên");

    private final String description;
}