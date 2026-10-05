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

    @PostMapping
    public ApiResponse<DisputeResponse> createDispute(
            @RequestAttribute("userId") Long userId,
            @Valid @RequestBody DisputeRequest request) {
        log.info("REST: Create dispute by user: {}", userId);
        return ApiResponse.success("Gửi tranh chấp thành công",
                disputeService.createDispute(userId, request));
    }

    @GetMapping("/my")
    public ApiResponse<List<DisputeResponse>> getMyDisputes(
            @RequestAttribute("userId") Long userId) {
        return ApiResponse.success(disputeService.getMyDisputes(userId));
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