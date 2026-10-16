package com.carrental.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO cho Quản lý Tiền Cọc & Quỹ Tạm Giữ (Escrow) của Admin.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminDepositSummaryResponse {

    Long holdingDepositAmount;      // Tiền cọc đang tạm giữ riêng (đơn PAID chờ duyệt)
    Long holdingDepositCount;       // Số đơn cọc đang tạm giữ
    Long mergedDepositAmount;       // Tiền cọc đã sáp nhập vào doanh thu (đơn đã duyệt APPROVED+)
    Long mergedDepositCount;        // Số đơn cọc đã sáp nhập doanh thu
    Long refundedDepositAmount;     // Tiền cọc đã hoàn trả (đơn CANCELLED)
    Long refundedDepositCount;      // Số đơn cọc đã hoàn trả

    List<DepositBookingItem> holdingBookings;
    List<DepositBookingItem> mergedBookings;
    List<DepositBookingItem> refundedBookings;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class DepositBookingItem {
        Long bookingId;
        String carName;
        String carPlate;
        String customerName;
        String customerPhone;
        String ownerName;
        String ownerPhone;
        Long depositAmount;
        Long totalPrice;
        String status;
        String statusDescription;
        LocalDateTime createdAt;
        String note;
    }
}
