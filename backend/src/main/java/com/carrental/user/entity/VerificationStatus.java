package com.carrental.user.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum VerificationStatus {

    UNVERIFIED("Chưa xác thực"),
    PENDING("Chờ duyệt"),
    VERIFIED("Đã xác thực"),
    REJECTED("Bị từ chối");

    private final String description;
}