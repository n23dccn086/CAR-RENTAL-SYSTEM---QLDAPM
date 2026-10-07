package com.carrental.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

/**
 * Response DTO cho Admin Dashboard.
 * Chứa tất cả số liệu tổng quan theo spec Role ADMIN.txt
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardStatsResponse {

    // ===== DOANH THU =====
    Long totalRevenue;              // Tổng doanh thu (chưa trích hoa hồng)
    Long platformRevenue;           // Số nền tảng thực nhận = % hoa hồng × totalRevenue
    BigDecimal commissionRate;      // % hoa hồng hiện tại

    // ===== ĐƠN HÀNG =====
    Long totalBookings;
    Long completedBookings;
    Long cancelledBookings;
    Double cancelRate;              // Tỉ lệ hủy = cancelled/total × 100 (%)

    // ===== CSAT =====
    Double csatCar;                 // AVG(carRating) — CSAT_xe
    Double csatOwner;               // AVG(ownerRating) — CSAT_chủ_xe
    Double csat;                    // (csatCar + csatOwner) / 2 — CSAT_tổng
    Long totalReviews;              // Số review

    // ===== HỒ SƠ CHỜ DUYỆT =====
    Long pendingCars;               // Xe chờ Admin duyệt
    Long pendingVerifications;      // User chờ xác thực GPLX/CCCD
    Long pendingOwnerRequests;      // Yêu cầu đăng ký chủ xe (UC chưa làm)
    Long pendingDisputes;           // Tranh chấp chờ xử lý (UC chưa làm)
}