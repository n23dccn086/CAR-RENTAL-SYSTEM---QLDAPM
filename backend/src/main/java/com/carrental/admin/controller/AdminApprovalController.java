package com.carrental.admin.controller;

import com.carrental.admin.dto.ApprovalResponse;
import com.carrental.admin.service.AdminApprovalService;
import com.carrental.common.dto.ApiResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller log duyệt hồ sơ (Admin).
 * Base path: /api/v1/admin/approvals
 */
@RestController
@RequestMapping("/admin/approvals")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AdminApprovalController {

    AdminApprovalService approvalService;

    /**
     * Lấy log duyệt theo target.
     * GET /api/v1/admin/approvals?targetType=USER_DOCUMENT&targetId=1
     */
    @GetMapping
    public ApiResponse<List<ApprovalResponse>> getLogsByTarget(
            @RequestParam String targetType,
            @RequestParam Long targetId) {
        return ApiResponse.success(approvalService.getLogsByTarget(targetType, targetId));
    }

    /**
     * Lịch sử duyệt của tôi.
     * GET /api/v1/admin/approvals/my
     */
    @GetMapping("/my")
    public ApiResponse<List<ApprovalResponse>> getMyApprovalHistory(
            @RequestAttribute("userId") Long adminId) {
        return ApiResponse.success(approvalService.getMyApprovalHistory(adminId));
    }

    /**
     * Ghi log duyệt (dùng nội bộ từ module khác).
     * POST /api/v1/admin/approvals
     */
    @PostMapping
    public ApiResponse<ApprovalResponse> logApproval(
            @RequestAttribute("userId") Long adminId,
            @RequestParam String targetType,
            @RequestParam Long targetId,
            @RequestParam String action,
            @RequestParam(required = false) String reason) {
        log.info("REST: Admin {} logging approval {} {}", adminId, targetType, targetId);
        return ApiResponse.success("Ghi log thành công",
                approvalService.logApproval(targetType, targetId, action, reason, adminId));
    }
}