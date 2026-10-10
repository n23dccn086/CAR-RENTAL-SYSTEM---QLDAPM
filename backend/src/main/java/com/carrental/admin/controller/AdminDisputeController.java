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
    public ApiResponse<Object> getAllDisputes(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        if (page != null || limit != null) {
            int pageIdx = page != null ? Math.max(0, page - 1) : 0;
            int pageSize = limit != null ? limit : 20;
            org.springframework.data.domain.Pageable pageable =
                    org.springframework.data.domain.PageRequest.of(pageIdx, pageSize);
            org.springframework.data.domain.Page<DisputeResponse> paged =
                    disputeService.getDisputesPaged(status, pageable);

            java.util.Map<String, Object> data = new java.util.LinkedHashMap<>();
            data.put("disputes", paged.getContent());
            java.util.Map<String, Object> pagination = new java.util.LinkedHashMap<>();
            pagination.put("page", paged.getNumber() + 1);
            pagination.put("limit", paged.getSize());
            pagination.put("total", paged.getTotalElements());
            pagination.put("total_pages", paged.getTotalPages());
            data.put("pagination", pagination);
            return ApiResponse.success(data);
        }

        if (status != null && !status.isBlank()) {
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

    /**
     * Contract 11.5: POST /admin/disputes/:id/resolve
     */
    @PostMapping("/{id}/resolve")
    public ApiResponse<DisputeResponse> resolveDisputePost(
            @PathVariable Long id,
            @RequestAttribute("userId") Long adminId,
            @jakarta.validation.Valid @RequestBody com.carrental.admin.dto.ResolveDisputeRequest request) {
        log.info("REST: Admin {} resolving dispute {} via POST body: {}", adminId, id, request);
        return ApiResponse.success("Giải quyết tranh chấp thành công",
                disputeService.resolveDispute(id, adminId, request));
    }

    /**
     * Frontend compatibility: PUT /admin/disputes/:id/resolve
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