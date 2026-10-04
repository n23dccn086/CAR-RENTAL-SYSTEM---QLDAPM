package com.carrental.payment.service;

import com.carrental.payment.dto.RefundResponse;

import java.util.List;

public interface RefundService {
    List<RefundResponse> getAllRefunds();
    List<RefundResponse> getRefundsByStatus(String status);
    RefundResponse approveRefund(Long refundId, Long adminId);
    RefundResponse rejectRefund(Long refundId, Long adminId, String reason);
    long countPending();
}