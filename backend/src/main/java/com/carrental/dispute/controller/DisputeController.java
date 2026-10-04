package com.carrental.dispute.controller;

import com.carrental.admin.dto.DisputeResponse;
import com.carrental.common.dto.ApiResponse;
import com.carrental.dispute.dto.DisputeRequest;
import com.carrental.dispute.service.DisputeService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/disputes")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class DisputeController {

    DisputeService disputeService;

    /**
     * User tạo tranh chấp.
     * POST /api/v1/disputes
     */
    @PostMapping
    public ApiResponse<DisputeResponse> createDispute(
            @RequestAttribute("userId") Long userId,
            @Valid @RequestBody DisputeRequest request) {
        log.info("REST: Create dispute by user: {} for booking: {}", userId, request.getBookingId());
        return ApiResponse.success("Gửi tranh chấp thành công",
                disputeService.createDispute(userId, request));
    }

    /**
     * User xem tranh chấp của mình.
     * GET /api/v1/disputes/my
     */
    @GetMapping("/my")
    public ApiResponse<List<DisputeResponse>> getMyDisputes(
            @RequestAttribute("userId") Long userId) {
        log.info("REST: Get my disputes by user: {}", userId);
        return ApiResponse.success(disputeService.getMyDisputes(userId));
    }

    /**
     * User xem chi tiết tranh chấp (chỉ của mình).
     * GET /api/v1/disputes/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<DisputeResponse> getDisputeById(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        log.info("REST: Get dispute {} by user: {}", id, userId);
        return ApiResponse.success(disputeService.getMyDisputeById(id, userId));
    }
}