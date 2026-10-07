package com.carrental.admin.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DashboardStatsResponse {

    // Doanh thu
    Long totalRevenue;              // Tổng doanh thu (chưa trích hoa hồng)
    Long platformRevenue;           // Số nền tảng thực nhận = commission_rate% × totalRevenue
    BigDecimal commissionRate;      // % hoa hồng

    // Đơn
    Long totalBookings;
    Long completedBookings;
    Long cancelledBookings;
    Double cancelRate;              // Tỉ lệ hủy (%)

    // CSAT
    Double csatCar;                 // AVG(carRating)
    Double csatOwner;               // AVG(ownerRating)
    Double csat;                    // (csatCar + csatOwner) / 2
    Long totalReviews;

    // Hồ sơ chờ duyệt
    Long pendingCars;
    Long pendingVerifications;
    Long pendingOwnerRequests;
    Long pendingDisputes;
}