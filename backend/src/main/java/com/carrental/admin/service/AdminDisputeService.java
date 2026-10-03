package com.carrental.admin.service;

import com.carrental.admin.dto.DisputeResponse;
import com.carrental.admin.entity.Dispute;

import java.math.BigDecimal;
import java.util.List;

public interface AdminDisputeService {

    List<DisputeResponse> getAllDisputes();

    List<DisputeResponse> getDisputesByStatus(String status);

    DisputeResponse getDisputeById(Long id);

    DisputeResponse resolveDispute(Long disputeId, Long adminId,
                                    String resolution, BigDecimal resolvedAmount);

    DisputeResponse escalateDispute(Long disputeId, Long adminId, String reason);

    long countPending();
}