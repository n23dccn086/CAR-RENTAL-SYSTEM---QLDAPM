package com.carrental.admin.controller;

import com.carrental.admin.dto.WithdrawalResponse;
import com.carrental.admin.service.AdminWithdrawalService;
import com.carrental.common.dto.ApiResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller duyệt yêu cầu rút tiền (Admin).
 * Base path: /api/v1/admin/withdrawals
 */
@RestController
@RequestMapping("/admin/withdrawals")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AdminWithdrawalController {

    AdminWithdrawalService withdrawalService;

    /**
     * Lấy tất cả yêu cầu rút tiền.
     * GET /api/v1/admin/withdrawals?status=PENDING
     */
    @GetMapping
    public ApiResponse<List<WithdrawalResponse>> getAllWithdrawals(
            @RequestParam(required = false) String status) {
        if (status != null) {
            return ApiResponse.success(withdrawalService.getWithdrawalsByStatus(status));
        }
        return ApiResponse.success(withdrawalService.getAllWithdrawals());
    }

    /**
     * Chi tiết yêu cầu rút tiền.
     * GET /api/v1/admin/withdrawals/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<WithdrawalResponse> getWithdrawalById(@PathVariable Long id) {
        return ApiResponse.success(withdrawalService.getWithdrawalById(id));
    }

    /**
     * Đếm số yêu cầu đang chờ.
     * GET /api/v1/admin/withdrawals/pending-count
     */
    @GetMapping("/pending-count")
    public ApiResponse<Long> countPending() {
        return ApiResponse.success(withdrawalService.countPending());
    }

    /**
     * Duyệt yêu cầu rút tiền.
     * PUT /api/v1/admin/withdrawals/{id}/approve
     */
    @PutMapping("/{id}/approve")
    public ApiResponse<WithdrawalResponse> approveWithdrawal(
            @PathVariable Long id,
            @RequestAttribute("userId") Long adminId,
            @RequestParam(required = false) String transactionId) {
        log.info("REST: Admin {} approving withdrawal {}", adminId, id);
        return ApiResponse.success("Duyệt yêu cầu thành công",
                withdrawalService.approveWithdrawal(id, adminId, transactionId));
    }

    /**
     * Từ chối yêu cầu rút tiền.
     * PUT /api/v1/admin/withdrawals/{id}/reject
     */
    @PutMapping("/{id}/reject")
    public ApiResponse<WithdrawalResponse> rejectWithdrawal(
            @PathVariable Long id,
            @RequestAttribute("userId") Long adminId,
            @RequestParam String reason) {
        log.info("REST: Admin {} rejecting withdrawal {}", adminId, id);
        return ApiResponse.success("Từ chối yêu cầu thành công",
                withdrawalService.rejectWithdrawal(id, adminId, reason));
    }
}