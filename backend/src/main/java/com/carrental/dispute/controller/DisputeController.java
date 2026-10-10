package com.carrental.dispute.controller;

import com.carrental.admin.dto.DisputeResponse;
import com.carrental.common.dto.ApiResponse;
import com.carrental.dispute.dto.CounterEvidenceRequest;
import com.carrental.dispute.dto.DisputeRequest;
import com.carrental.dispute.dto.EvidenceRequest;
import com.carrental.dispute.dto.ReviewRequest;
import com.carrental.dispute.dto.UploadResponse;
import com.carrental.dispute.service.CounterEvidenceService;
import com.carrental.dispute.service.DisputeService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/disputes")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class DisputeController {

    DisputeService disputeService;
    CounterEvidenceService counterEvidenceService;

    /**
     * Contract 9.1 (JSON) + Frontend
     */
    @PostMapping(consumes = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public ApiResponse<DisputeResponse> createDisputeJson(
            @RequestAttribute("userId") Long userId,
            @Valid @RequestBody DisputeRequest request) {
        log.info("REST: Create dispute by user (JSON): {}", userId);
        return ApiResponse.success("Đã gửi tranh chấp",
                disputeService.createDispute(userId, request));
    }

    /**
     * Contract 9.1: POST /disputes (multipart/form-data)
     */
    @PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public ApiResponse<DisputeResponse> createDisputeMultipart(
            @RequestAttribute("userId") Long userId,
            @RequestParam("booking_id") Long bookingId,
            @RequestParam(value = "against_user_id", required = false) Long againstUserId,
            @RequestParam("category") String category,
            @RequestParam("description") String description,
            @RequestParam(value = "claimed_amount", required = false) java.math.BigDecimal claimedAmount,
            @RequestPart(value = "evidence", required = false) List<MultipartFile> evidenceFiles) {
        log.info("REST: Create dispute by user (multipart): user={}, bookingId={}", userId, bookingId);
        return ApiResponse.success("Đã gửi tranh chấp",
                disputeService.createDisputeMultipart(userId, bookingId, againstUserId, category, description, claimedAmount, evidenceFiles));
    }

    /**
     * Contract 9.2: GET /disputes/my?status=pending&page=1&limit=10
     */
    @GetMapping("/my")
    public ApiResponse<Object> getMyDisputes(
            @RequestAttribute("userId") Long userId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        if (page != null || limit != null) {
            int pageIdx = page != null ? Math.max(0, page - 1) : 0;
            int pageSize = limit != null ? limit : 10;
            org.springframework.data.domain.Pageable pageable =
                    org.springframework.data.domain.PageRequest.of(pageIdx, pageSize);
            org.springframework.data.domain.Page<DisputeResponse> paged =
                    disputeService.getMyDisputesPaged(userId, status, pageable);

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

        List<DisputeResponse> list = disputeService.getMyDisputes(userId);
        if (status != null && !status.isBlank()) {
            list = list.stream().filter(d -> status.equalsIgnoreCase(d.getStatus())).toList();
        }
        return ApiResponse.success(list);
    }

    @GetMapping("/against-me")
    public ApiResponse<List<DisputeResponse>> getDisputesAgainstMe(
            @RequestAttribute("userId") Long userId) {
        return ApiResponse.success(disputeService.getDisputesAgainstMe(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<DisputeResponse> getDisputeById(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        return ApiResponse.success(disputeService.getMyDisputeById(id, userId));
    }

    @PutMapping("/{id}/submit-evidence")
    public ApiResponse<DisputeResponse> submitEvidence(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId,
            @Valid @RequestBody EvidenceRequest request) {
        log.info("REST: User {} submitting evidence for dispute {}", userId, id);
        return ApiResponse.success("Đã gửi bằng chứng bổ sung",
                disputeService.submitEvidence(id, userId, request));
    }

    @PostMapping("/upload")
    public ApiResponse<UploadResponse> uploadEvidence(
            @RequestParam("file") MultipartFile file,
            @RequestAttribute("userId") Long userId) throws IOException {
        log.info("REST: User {} uploading evidence", userId);
        return ApiResponse.success("Upload file thành công",
                disputeService.uploadEvidence(file, userId));
    }

    /** Khách hàng (bên bị kiện) ĐỒNG Ý - không phản bác */
    @PutMapping("/{id}/accept")
    public ApiResponse<DisputeResponse> acceptDispute(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        log.info("REST: User {} accepting dispute {}", userId, id);
        return ApiResponse.success("Đã xác nhận đồng ý",
                counterEvidenceService.acceptDispute(id, userId));
    }

    /** Khách hàng (bên bị kiện) PHẢN BÁC */
    @PutMapping("/{id}/counter-evidence")
    public ApiResponse<DisputeResponse> fileCounterEvidence(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId,
            @Valid @RequestBody CounterEvidenceRequest request) {
        log.info("REST: User {} filing counter evidence for dispute {}", userId, id);
        return ApiResponse.success("Đã gửi phản bác",
                counterEvidenceService.fileCounterEvidence(id, userId, request));
    }

    /** Bổ sung thông tin khi được admin yêu cầu xem xét lại */
    @PutMapping("/{id}/submit-review")
    public ApiResponse<DisputeResponse> submitReview(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId,
            @Valid @RequestBody ReviewRequest request) {
        log.info("REST: User {} submitting review for dispute {}", userId, id);
        return ApiResponse.success("Đã gửi bổ sung",
                counterEvidenceService.submitReview(id, userId, request));
    }
}