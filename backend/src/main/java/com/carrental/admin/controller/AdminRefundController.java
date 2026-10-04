package com.carrental.admin.controller;

import com.carrental.common.dto.ApiResponse;
import com.carrental.payment.dto.RefundResponse;
import com.carrental.payment.service.RefundService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/refunds")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminRefundController {

    RefundService refundService;

    @GetMapping
    public ApiResponse<List<RefundResponse>> getAllRefunds(
            @RequestParam(required = false) String status) {
        if (status != null) {
            return ApiResponse.success(refundService.getRefundsByStatus(status));
        }
        return ApiResponse.success(refundService.getAllRefunds());
    }

    @GetMapping("/pending-count")
    public ApiResponse<Long> countPending() {
        return ApiResponse.success(refundService.countPending());
    }

    @PutMapping("/{id}/approve")
    public ApiResponse<RefundResponse> approveRefund(
            @PathVariable Long id,
            @RequestAttribute("userId") Long adminId) {
        log.info("Admin {} approving refund {}", adminId, id);
        return ApiResponse.success("Đã duyệt hoàn tiền",
                refundService.approveRefund(id, adminId));
    }

    @PutMapping("/{id}/reject")
    public ApiResponse<RefundResponse> rejectRefund(
            @PathVariable Long id,
            @RequestAttribute("userId") Long adminId,
            @RequestParam String reason) {
        log.info("Admin {} rejecting refund {}", adminId, id);
        return ApiResponse.success("Đã từ chối hoàn tiền",
                refundService.rejectRefund(id, adminId, reason));
    }
}