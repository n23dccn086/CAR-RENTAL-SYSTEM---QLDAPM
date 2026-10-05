package com.carrental.admin.controller;

import com.carrental.admin.dto.DisputeResponse;
import com.carrental.admin.service.AdminDisputeService;
import com.carrental.common.dto.ApiResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/admin/disputes")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminDisputeController {

    AdminDisputeService disputeService;

    @GetMapping
    public ApiResponse<List<DisputeResponse>> getAllDisputes(
            @RequestParam(required = false) String status) {
        if (status != null) {
            return ApiResponse.success(disputeService.getDisputesByStatus(status));
        }
        return ApiResponse.success(disputeService.getAllDisputes());
    }

    @GetMapping("/{id}")
    public ApiResponse<DisputeResponse> getDisputeById(@PathVariable Long id) {
        return ApiResponse.success(disputeService.getDisputeById(id));
    }

    @GetMapping("/pending-count")
    public ApiResponse<Long> countPending() {
        return ApiResponse.success(disputeService.countPending());
    }

    /** Admin duyệt form của người khởi kiện (raiser) */
    @PutMapping("/{id}/approve-raiser")
    public ApiResponse<DisputeResponse> approveRaiser(
            @PathVariable Long id,
            @RequestAttribute("userId") Long adminId) {
        log.info("REST: Admin {} approving raiser for dispute {}", adminId, id);
        return ApiResponse.success("Đã duyệt form người khởi kiện",
                disputeService.approveRaiser(id, adminId));
    }

    /** Admin duyệt form của người bị kiện (against) */
    @PutMapping("/{id}/approve-against")
    public ApiResponse<DisputeResponse> approveAgainst(
            @PathVariable Long id,
            @RequestAttribute("userId") Long adminId) {
        log.info("REST: Admin {} approving against for dispute {}", adminId, id);
        return ApiResponse.success("Đã duyệt form người bị kiện",
                disputeService.approveAgainst(id, adminId));
    }

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
     * Admin yêu cầu bổ sung bằng chứng.
     * @param target "RAISER" | "AGAINST" | "BOTH"
     */
    @PutMapping("/{id}/request-evidence")
    public ApiResponse<DisputeResponse> requestEvidence(
            @PathVariable Long id,
            @RequestAttribute("userId") Long adminId,
            @RequestParam String target,
            @RequestParam String request) {
        log.info("REST: Admin {} requesting evidence for dispute {} target {}",
                adminId, id, target);
        return ApiResponse.success("Đã gửi yêu cầu bổ sung bằng chứng",
                disputeService.requestEvidence(id, adminId, target, request));
    }

    @PutMapping("/{id}/finalize")
    public ApiResponse<DisputeResponse> finalizeDispute(
            @PathVariable Long id,
            @RequestAttribute("userId") Long adminId,
            @RequestParam String resolution,
            @RequestParam(required = false) BigDecimal resolvedAmount) {
        log.info("REST: Admin {} finalizing dispute {}", adminId, id);
        return ApiResponse.success("Đã tạo hợp đồng tranh chấp",
                disputeService.finalizeDispute(id, adminId, resolution, resolvedAmount));
    }
}