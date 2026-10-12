package com.carrental.payment.service;

import com.carrental.payment.dto.RefundResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface RefundService {

    List<RefundResponse> getAllRefunds();
    List<RefundResponse> getRefundsByStatus(String status);
    RefundResponse approveRefund(Long refundId, Long adminId);
    RefundResponse rejectRefund(Long refundId, Long adminId, String reason);
    long countPending();

    // ★ MỚI: Phân trang
    Page<RefundResponse> getRefundsPaged(String status, Pageable pageable);
}