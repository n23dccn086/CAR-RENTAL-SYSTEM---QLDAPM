package com.carrental.admin.service;

import com.carrental.admin.dto.DisputeMapper;
import com.carrental.admin.dto.DisputeResponse;
import com.carrental.admin.entity.Dispute;
import com.carrental.admin.repository.DisputeRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AdminDisputeServiceImpl implements AdminDisputeService {

    DisputeRepository disputeRepository;
    DisputeMapper disputeMapper;

    @Override
    public List<DisputeResponse> getAllDisputes() {
        List<Dispute> disputes = disputeRepository.findAll();
        return disputeMapper.toResponseList(disputes);
    }

    @Override
    public List<DisputeResponse> getDisputesByStatus(String status) {
        List<Dispute> disputes = disputeRepository.findByStatusOrderByCreatedAtDesc(status);
        return disputeMapper.toResponseList(disputes);
    }

    @Override
    public DisputeResponse getDisputeById(Long id) {
        Dispute dispute = getEntityById(id);
        return disputeMapper.toResponse(dispute);
    }

    @Override
    @Transactional
    public DisputeResponse resolveDispute(Long disputeId, Long adminId,
                                           String resolution, BigDecimal resolvedAmount) {
        log.info("Admin {} resolving dispute {}", adminId, disputeId);

        Dispute dispute = getEntityById(disputeId);

        if ("RESOLVED".equals(dispute.getStatus()) || "CLOSED".equals(dispute.getStatus())) {
            throw new BadRequestException(ErrorCode.DISPUTE_ALREADY_RESOLVED);
        }

        dispute.setStatus("RESOLVED");
        dispute.setResolution(resolution);
        dispute.setResolvedAmount(resolvedAmount);
        dispute.setResolvedBy(adminId);
        dispute.setResolvedAt(LocalDateTime.now());

        Dispute updated = disputeRepository.save(dispute);
        return disputeMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public DisputeResponse escalateDispute(Long disputeId, Long adminId, String reason) {
        log.info("Admin {} escalating dispute {}", adminId, disputeId);

        Dispute dispute = getEntityById(disputeId);
        dispute.setStatus("ESCALATED");
        dispute.setResolution(reason);
        dispute.setResolvedBy(adminId);

        Dispute updated = disputeRepository.save(dispute);
        return disputeMapper.toResponse(updated);
    }

    @Override
    public long countPending() {
        return disputeRepository.countByStatus("PENDING");
    }

    private Dispute getEntityById(Long id) {
        return disputeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DISPUTE_NOT_FOUND));
    }
}