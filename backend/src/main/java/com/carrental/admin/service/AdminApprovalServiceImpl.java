package com.carrental.admin.service;

import com.carrental.admin.dto.ApprovalMapper;
import com.carrental.admin.dto.ApprovalResponse;
import com.carrental.admin.entity.ApprovalLog;
import com.carrental.admin.repository.ApprovalLogRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AdminApprovalServiceImpl implements AdminApprovalService {

    ApprovalLogRepository approvalLogRepository;
    ApprovalMapper approvalMapper;

    @Override
    public List<ApprovalResponse> getLogsByTarget(String targetType, Long targetId) {
        return approvalMapper.toResponseList(
                approvalLogRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId));
    }

    @Override
    @Transactional
    public ApprovalResponse logApproval(String targetType, Long targetId,
                                         String action, String reason, Long adminId) {
        log.info("Admin {} logging approval: {} {} -> {}", adminId, targetType, targetId, action);

        ApprovalLog log = ApprovalLog.builder()
                .targetType(targetType)
                .targetId(targetId)
                .action(action)
                .reason(reason)
                .approvedBy(adminId)
                .build();

        ApprovalLog saved = approvalLogRepository.save(log);
        return approvalMapper.toResponse(saved);
    }

    @Override
    public List<ApprovalResponse> getMyApprovalHistory(Long adminId) {
        return approvalMapper.toResponseList(
                approvalLogRepository.findByApprovedByOrderByCreatedAtDesc(adminId));
    }
}