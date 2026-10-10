package com.carrental.dispute.service;

import com.carrental.admin.dto.DisputeResponse;
import com.carrental.dispute.dto.DisputeRequest;
import com.carrental.dispute.dto.EvidenceRequest;
import com.carrental.dispute.dto.UploadResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface DisputeService {

    /** User tạo tranh chấp qua JSON */
    DisputeResponse createDispute(Long userId, DisputeRequest request);

    /** User tạo tranh chấp qua multipart/form-data (Contract 9.1) */
    DisputeResponse createDisputeMultipart(
            Long userId,
            Long bookingId,
            Long againstUserId,
            String category,
            String description,
            java.math.BigDecimal claimedAmount,
            List<MultipartFile> evidenceFiles);

    /** User xem danh sách tranh chấp của mình */
    List<DisputeResponse> getMyDisputes(Long userId);

    /** User xem danh sách tranh chấp phân trang theo Contract 9.2 */
    org.springframework.data.domain.Page<DisputeResponse> getMyDisputesPaged(
            Long userId, String status, org.springframework.data.domain.Pageable pageable);

    /** User xem chi tiết tranh chấp */
    DisputeResponse getMyDisputeById(Long id, Long userId);

    /** User bổ sung bằng chứng khi admin yêu cầu */
    DisputeResponse submitEvidence(Long disputeId, Long userId, EvidenceRequest request);

    /** Upload ảnh bằng chứng */
    UploadResponse uploadEvidence(MultipartFile file, Long userId) throws IOException;

    /** Xem danh sách dispute mà mình bị kiện (bên against) */
    List<DisputeResponse> getDisputesAgainstMe(Long userId);
}