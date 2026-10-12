package com.carrental.admin.controller;

import com.carrental.common.dto.ApiResponse;
import com.carrental.payment.dto.RefundResponse;
import com.carrental.payment.service.RefundService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/refunds")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminRefundController {

    RefundService refundService;

    /**
     * ★ SỬA: Endpoint phân trang
     * GET /admin/refunds?status=PENDING&page=0&size=10
     */
    @GetMapping
    public ApiResponse<Map<String, Object>> getAllRefunds(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("Admin get refunds: status={}, page={}, size={}", status, page, size);

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<RefundResponse> paged = refundService.getRefundsPaged(status, pageable);

        // Wrap trong Map để giữ cấu trúc { content, totalPages, totalElements }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("content", paged.getContent());
        data.put("totalPages", paged.getTotalPages());
        data.put("totalElements", paged.getTotalElements());
        data.put("number", paged.getNumber());
        data.put("size", paged.getSize());
        data.put("first", paged.isFirst());
        data.put("last", paged.isLast());

        return ApiResponse.success(data);
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