package com.carrental.payment.service;

import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.payment.dto.RefundMapper;
import com.carrental.payment.dto.RefundResponse;
import com.carrental.payment.entity.PaymentStatus;
import com.carrental.payment.entity.Refund;
import com.carrental.payment.repository.RefundRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RefundServiceImpl implements RefundService {

    RefundRepository refundRepository;
    RefundMapper refundMapper;

    @Override
    public List<RefundResponse> getAllRefunds() {
        return refundMapper.toResponseList(refundRepository.findAll());
    }

    @Override
    public List<RefundResponse> getRefundsByStatus(String status) {
        PaymentStatus s = PaymentStatus.valueOf(status);
        return refundMapper.toResponseList(
                refundRepository.findByStatusOrderByCreatedAtDesc(s));
    }

    @Override
    @Transactional
    public RefundResponse approveRefund(Long refundId, Long adminId) {
        log.info("Admin {} approving refund {}", adminId, refundId);

        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PAYMENT_NOT_FOUND));

        if (refund.getStatus() != PaymentStatus.PENDING) {
            throw new BadRequestException(ErrorCode.PAYMENT_FAILED, "Refund đã xử lý");
        }

        refund.setStatus(PaymentStatus.SUCCESS);
        refund.setProcessedAt(LocalDateTime.now());
        refund.setRefundTransactionId("RF_" + System.currentTimeMillis());

        Refund updated = refundRepository.save(refund);
        return refundMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public RefundResponse rejectRefund(Long refundId, Long adminId, String reason) {
        log.info("Admin {} rejecting refund {}", adminId, refundId);

        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PAYMENT_NOT_FOUND));

        if (refund.getStatus() != PaymentStatus.PENDING) {
            throw new BadRequestException(ErrorCode.PAYMENT_FAILED, "Refund đã xử lý");
        }

        refund.setStatus(PaymentStatus.CANCELLED);
        refund.setReason(refund.getReason() + " | Admin từ chối: " + reason);
        refund.setProcessedAt(LocalDateTime.now());

        Refund updated = refundRepository.save(refund);
        return refundMapper.toResponse(updated);
    }

    @Override
    public long countPending() {
        return refundRepository.countByStatus(PaymentStatus.PENDING);
    }
}