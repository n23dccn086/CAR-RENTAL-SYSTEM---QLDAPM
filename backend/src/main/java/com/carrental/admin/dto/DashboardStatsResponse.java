package com.carrental.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

/**
 * Response DTO cho Admin Dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardStatsResponse {

    // ===== DOANH THU =====
    Long totalRevenue;
    Long platformRevenue;
    BigDecimal commissionRate;

    // ===== ĐƠN HÀNG =====
    Long totalBookings;
    Long completedBookings;
    Long cancelledBookings;
    Double cancelRate;

    // ===== CSAT =====
    Double csatCar;
    Double csatOwner;
    Double csat;
    Long totalReviews;

    // ===== HỒ SƠ CHỜ DUYỆT =====
    Long pendingCars;
    Long pendingDrivers;
    Long pendingVerifications;
    Long pendingOwnerRequests;
    Long pendingDisputes;
}