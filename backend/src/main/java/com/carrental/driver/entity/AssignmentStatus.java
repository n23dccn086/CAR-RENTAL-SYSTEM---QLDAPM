package com.carrental.driver.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Trạng thái phân công tài xế:
 * - PENDING: Đang chờ tài xế phản hồi
 * - ACCEPTED: Tài xế đã nhận
 * - REJECTED: Tài xế từ chối
 * - EXPIRED: Hết hạn phản hồi (coi như từ chối)
 * - CANCELLED: Owner hủy gán
 */
@Getter
@RequiredArgsConstructor
public enum AssignmentStatus {

    PENDING("Chờ tài xế phản hồi"),
    ACCEPTED("Tài xế đã nhận"),
    REJECTED("Tài xế từ chối"),
    EXPIRED("Hết hạn phản hồi"),
    CANCELLED("Đã hủy");

    private final String description;
}