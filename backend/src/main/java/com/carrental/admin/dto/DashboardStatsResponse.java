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
    Integer depositPercent;

    // ===== TIỀN CỌC & QUỸ TẠM GIỮ (ESCROW) =====
    Long holdingDepositAmount;      // Tiền cọc đang tạm giữ riêng (các đơn PAID chờ chủ xe duyệt)
    Long holdingDepositCount;       // Số đơn cọc đang tạm giữ
    Long mergedDepositAmount;       // Tiền cọc đã duyệt & sáp nhập vào doanh thu (APPROVED+)
    Long mergedDepositCount;        // Số đơn cọc đã sáp nhập doanh thu
    Long refundedDepositAmount;     // Tiền cọc đã hoàn trả cho khách (CANCELLED)
    Long refundedDepositCount;      // Số đơn cọc đã hoàn trả

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