package com.carrental.admin.controller;

import com.carrental.admin.dto.OwnerRequestResponse;
import com.carrental.admin.service.OwnerRegistrationService;
import com.carrental.common.dto.ApiResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller cho Admin duyệt yêu cầu đăng ký chủ xe.
 * Base path: /api/v1/admin/owner-requests
 */
@RestController
@RequestMapping("/admin/owner-requests")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminOwnerRequestController {

    OwnerRegistrationService ownerRegistrationService;

    /**
     * Admin list tất cả yêu cầu (có filter theo status).
     * GET /api/v1/admin/owner-requests?status=PENDING
     */
    @GetMapping
    public ApiResponse<List<OwnerRequestResponse>> getAllRequests(
            @RequestParam(required = false) String status) {
        log.info("REST: Admin get owner requests, status={}", status);
        return ApiResponse.success(ownerRegistrationService.getAllRequests(status));
    }

    /**
     * Đếm số yêu cầu PENDING.
     * GET /api/v1/admin/owner-requests/pending-count
     */
    @GetMapping("/pending-count")
    public ApiResponse<Long> countPending() {
        return ApiResponse.success(ownerRegistrationService.countPending());
    }

    /**
     * Admin xem chi tiết 1 yêu cầu.
     * GET /api/v1/admin/owner-requests/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<OwnerRequestResponse> getRequestById(@PathVariable Long id) {
        log.info("REST: Admin get owner request {}", id);
        return ApiResponse.success(ownerRegistrationService.getRequestById(id));
    }

    /**
     * Admin duyệt yêu cầu → nâng role OWNER.
     * PUT /api/v1/admin/owner-requests/{id}/approve
     */
    @PutMapping("/{id}/approve")
    public ApiResponse<OwnerRequestResponse> approveRequest(
            @PathVariable Long id,
            @RequestAttribute("userId") Long adminId) {
        log.info("REST: Admin {} approving owner request {}", adminId, id);
        return ApiResponse.success("Đã duyệt yêu cầu đăng ký chủ xe",
                ownerRegistrationService.approveRequest(id, adminId));
    }

    /**
     * Admin từ chối yêu cầu (kèm lý do).
     * PUT /api/v1/admin/owner-requests/{id}/reject?reason=...
     */
    @PutMapping("/{id}/reject")
    public ApiResponse<OwnerRequestResponse> rejectRequest(
            @PathVariable Long id,
            @RequestAttribute("userId") Long adminId,
            @RequestParam String reason) {
        log.info("REST: Admin {} rejecting owner request {}", adminId, id);
        return ApiResponse.success("Đã từ chối yêu cầu",
                ownerRegistrationService.rejectRequest(id, adminId, reason));
    }
}