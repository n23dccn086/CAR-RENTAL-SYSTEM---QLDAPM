package com.carrental.admin.controller;

import com.carrental.admin.dto.CreateWithdrawalRequest;
import com.carrental.admin.dto.WithdrawalResponse;
import com.carrental.admin.service.OwnerWithdrawalService;
import com.carrental.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/owner/withdrawals")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("hasRole('OWNER')")
public class OwnerWithdrawalController {

    OwnerWithdrawalService ownerWithdrawalService;

    /**
     * Owner tạo yêu cầu rút tiền.
     * POST /api/v1/owner/withdrawals
     */
    @PostMapping
    public ApiResponse<WithdrawalResponse> createWithdrawal(
            @RequestAttribute("userId") Long ownerId,
            @Valid @RequestBody CreateWithdrawalRequest request) {
        log.info("REST: Owner {} creating withdrawal", ownerId);
        return ApiResponse.success("Gửi yêu cầu rút tiền thành công",
                ownerWithdrawalService.createWithdrawal(ownerId, request));
    }

    /**
     * Owner xem lịch sử rút tiền.
     * GET /api/v1/owner/withdrawals/my
     */
    @GetMapping("/my")
    public ApiResponse<List<WithdrawalResponse>> getMyWithdrawals(
            @RequestAttribute("userId") Long ownerId) {
        return ApiResponse.success(ownerWithdrawalService.getMyWithdrawals(ownerId));
    }

    /**
     * Owner xem số dư khả dụng + thông tin rút tiền.
     * GET /api/v1/owner/withdrawals/balance
     */
    @GetMapping("/balance")
    public ApiResponse<Map<String, Object>> getBalance(
            @RequestAttribute("userId") Long ownerId) {
        return ApiResponse.success(ownerWithdrawalService.getBalanceInfo(ownerId));
    }
}