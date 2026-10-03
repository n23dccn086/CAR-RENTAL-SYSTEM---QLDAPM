package com.carrental.admin.controller;

import com.carrental.admin.dto.DisputeResponse;
import com.carrental.admin.service.AdminDisputeService;
import com.carrental.common.dto.ApiResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Controller quản lý tranh chấp (Admin).
 * Base path: /api/v1/admin/disputes
 */
@RestController
@RequestMapping("/admin/disputes")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AdminDisputeController {

    AdminDisputeService disputeService;

    /**
     * Lấy tất cả tranh chấp (có filter theo status).
     * GET /api/v1/admin/disputes?status=PENDING
     */
    @GetMapping
    public ApiResponse<List<DisputeResponse>> getAllDisputes(
            @RequestParam(required = false) String status) {
        if (status != null) {
            return ApiResponse.success(disputeService.getDisputesByStatus(status));
        }
        return ApiResponse.success(disputeService.getAllDisputes());
    }

    /**
     * Chi tiết tranh chấp.
     * GET /api/v1/admin/disputes/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<DisputeResponse> getDisputeById(@PathVariable Long id) {
        return ApiResponse.success(disputeService.getDisputeById(id));
    }

    /**
     * Đếm số tranh chấp đang chờ.
     * GET /api/v1/admin/disputes/pending-count
     */
    @GetMapping("/pending-count")
    public ApiResponse<Long> countPending() {
        return ApiResponse.success(disputeService.countPending());
    }

    /**
     * Giải quyết tranh chấp.
     * PUT /api/v1/admin/disputes/{id}/resolve
     */
    @PutMapping("/{id}/resolve")
    public ApiResponse<DisputeResponse> resolveDispute(
            @PathVariable Long id,
            @RequestAttribute("userId") Long adminId,
            @RequestParam String resolution,
            @RequestParam(required = false) BigDecimal resolvedAmount) {
        log.info("REST: Admin {} resolving dispute {}", adminId, id);
        return ApiResponse.success("Giải quyết tranh chấp thành công",
                disputeService.resolveDispute(id, adminId, resolution, resolvedAmount));
    }

    /**
     * Chuyển tranh chấp lên cấp cao.
     * PUT /api/v1/admin/disputes/{id}/escalate
     */
    @PutMapping("/{id}/escalate")
    public ApiResponse<DisputeResponse> escalateDispute(
            @PathVariable Long id,
            @RequestAttribute("userId") Long adminId,
            @RequestParam String reason) {
        log.info("REST: Admin {} escalating dispute {}", adminId, id);
        return ApiResponse.success("Đã chuyển cấp",
                disputeService.escalateDispute(id, adminId, reason));
    }
}