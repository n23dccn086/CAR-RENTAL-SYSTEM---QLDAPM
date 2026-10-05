package com.carrental.dispute.service;

import com.carrental.admin.dto.DisputeResponse;
import com.carrental.dispute.dto.CounterEvidenceRequest;
import com.carrental.dispute.dto.ReviewRequest;

public interface CounterEvidenceService {

    /** Khách hàng đồng ý (không phản bác) */
    DisputeResponse acceptDispute(Long disputeId, Long userId);

    /** Khách hàng (bên bị kiện) phản bác */
    DisputeResponse fileCounterEvidence(Long disputeId, Long userId, CounterEvidenceRequest request);

    /** Bên được yêu cầu bổ sung thông tin */
    DisputeResponse submitReview(Long disputeId, Long userId, ReviewRequest request);
}