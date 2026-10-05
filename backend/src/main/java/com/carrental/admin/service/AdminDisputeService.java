package com.carrental.admin.service;

import com.carrental.admin.dto.DisputeResponse;

import java.math.BigDecimal;
import java.util.List;

public interface AdminDisputeService {

    List<DisputeResponse> getAllDisputes();

    List<DisputeResponse> getDisputesByStatus(String status);

    DisputeResponse getDisputeById(Long id);

    DisputeResponse approveRaiser(Long disputeId, Long adminId);

    DisputeResponse approveAgainst(Long disputeId, Long adminId);

    DisputeResponse resolveDispute(Long disputeId, Long adminId,
            String resolution, BigDecimal resolvedAmount);

    DisputeResponse requestEvidence(Long disputeId, Long adminId, String target, String request);

    DisputeResponse finalizeDispute(Long disputeId, Long adminId,
            String resolution, BigDecimal resolvedAmount);

    long countPending();
}