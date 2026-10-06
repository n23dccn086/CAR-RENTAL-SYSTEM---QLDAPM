package com.carrental.admin.controller;

import com.carrental.admin.dto.WithdrawalResponse;
import com.carrental.admin.service.AdminWithdrawalService;
import com.carrental.common.dto.ApiResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/withdrawals")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminWithdrawalController {

    AdminWithdrawalService withdrawalService;

    @GetMapping
    public ApiResponse<List<WithdrawalResponse>> getAllWithdrawals(
            @RequestParam(required = false) String status) {
        if (status != null) {
            return ApiResponse.success(withdrawalService.getWithdrawalsByStatus(status));
        }
        return ApiResponse.success(withdrawalService.getAllWithdrawals());
    }

    @GetMapping("/{id}")
    public ApiResponse<WithdrawalResponse> getWithdrawalById(@PathVariable Long id) {
        return ApiResponse.success(withdrawalService.getWithdrawalById(id));
    }

    @GetMapping("/pending-count")
    public ApiResponse<Long> countPending() {
        return ApiResponse.success(withdrawalService.countPending());
    }

    @PutMapping("/{id}/approve")
    public ApiResponse<WithdrawalResponse> approveWithdrawal(
            @PathVariable Long id,
            @RequestAttribute("userId") Long adminId,
            @RequestParam(required = false) String transactionId) {
        log.info("REST: Admin {} approving withdrawal {}", adminId, id);
        return ApiResponse.success("Duyệt yêu cầu thành công",
                withdrawalService.approveWithdrawal(id, adminId, transactionId));
    }

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