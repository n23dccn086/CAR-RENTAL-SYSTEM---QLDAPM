package com.carrental.admin.service;

import com.carrental.admin.dto.WithdrawalMapper;
import com.carrental.admin.dto.WithdrawalResponse;
import com.carrental.admin.entity.Withdrawal;
import com.carrental.admin.repository.WithdrawalRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
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
public class AdminWithdrawalServiceImpl implements AdminWithdrawalService {

    WithdrawalRepository withdrawalRepository;
    WithdrawalMapper withdrawalMapper;

    @Override
    public List<WithdrawalResponse> getAllWithdrawals() {
        return withdrawalMapper.toResponseList(withdrawalRepository.findAll());
    }

    @Override
    public List<WithdrawalResponse> getWithdrawalsByStatus(String status) {
        return withdrawalMapper.toResponseList(
                withdrawalRepository.findByStatusOrderByCreatedAtDesc(status));
    }

    @Override
    public WithdrawalResponse getWithdrawalById(Long id) {
        Withdrawal w = getEntityById(id);
        return withdrawalMapper.toResponse(w);
    }

    @Override
    @Transactional
    public WithdrawalResponse approveWithdrawal(Long withdrawalId, Long adminId, String transactionId) {
        log.info("Admin {} approving withdrawal {}", adminId, withdrawalId);

        Withdrawal w = getEntityById(withdrawalId);

        if (!"PENDING".equals(w.getStatus())) {
            throw new BadRequestException(ErrorCode.WITHDRAWAL_ALREADY_PROCESSED);
        }

        w.setStatus("COMPLETED");
        w.setProcessedBy(adminId);
        w.setProcessedAt(LocalDateTime.now());
        w.setTransactionId(transactionId);

        Withdrawal updated = withdrawalRepository.save(w);
        return withdrawalMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public WithdrawalResponse rejectWithdrawal(Long withdrawalId, Long adminId, String reason) {
        log.info("Admin {} rejecting withdrawal {}", adminId, withdrawalId);

        Withdrawal w = getEntityById(withdrawalId);

        if (!"PENDING".equals(w.getStatus())) {
            throw new BadRequestException(ErrorCode.WITHDRAWAL_ALREADY_PROCESSED);
        }

        w.setStatus("REJECTED");
        w.setRejectReason(reason);
        w.setProcessedBy(adminId);
        w.setProcessedAt(LocalDateTime.now());

        Withdrawal updated = withdrawalRepository.save(w);
        return withdrawalMapper.toResponse(updated);
    }

    @Override
    public long countPending() {
        return withdrawalRepository.countByStatus("PENDING");
    }

    private Withdrawal getEntityById(Long id) {
        return withdrawalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.WITHDRAWAL_NOT_FOUND));
    }
}