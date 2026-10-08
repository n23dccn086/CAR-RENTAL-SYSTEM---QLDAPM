package com.carrental.admin.service;

import com.carrental.admin.dto.DisputeMapper;
import com.carrental.admin.dto.DisputeResponse;
import com.carrental.admin.entity.Dispute;
import com.carrental.admin.repository.DisputeRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
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
    NotificationService notificationService;
    DisputeContractService disputeContractService;

    @Override
    public List<DisputeResponse> getAllDisputes() {
        return disputeMapper.toResponseList(disputeRepository.findAll());
    }

    @Override
    public List<DisputeResponse> getDisputesByStatus(String status) {
        return disputeMapper.toResponseList(
                disputeRepository.findByStatusOrderByCreatedAtDesc(status));
    }

    @Override
    public DisputeResponse getDisputeById(Long id) {
        return disputeMapper.toResponse(getEntityById(id));
    }

    // ===== APPROVE RAISER =====

    @Override
    @Transactional
    public DisputeResponse approveRaiser(Long disputeId, Long adminId) {
        log.info("Admin {} approving raiser for dispute {}", adminId, disputeId);

        Dispute dispute = getEntityById(disputeId);

        if (!"PENDING".equals(dispute.getStatus())
                && !"COUNTER_FILED".equals(dispute.getStatus())
                && !"ACCEPTED".equals(dispute.getStatus())
                && !"APPROVED_AGAINST".equals(dispute.getStatus())) {
            throw new BadRequestException(ErrorCode.DISPUTE_INVALID_STATUS,
                    "Không thể duyệt form ở trạng thái này");
        }

        String note = String.format(
                "{\"at\":\"%s\",\"by\":%d,\"action\":\"APPROVE_RAISER\"}",
                LocalDateTime.now(), adminId);
        appendHistory(dispute, note);

        if ("APPROVED_AGAINST".equals(dispute.getStatus())) {
            dispute.setStatus("READY_TO_FINALIZE");
        } else {
            dispute.setStatus("APPROVED_RAISER");
        }

        Dispute updated = disputeRepository.save(dispute);
        return disputeMapper.toResponse(updated);
    }

    // ===== APPROVE AGAINST =====

    @Override
    @Transactional
    public DisputeResponse approveAgainst(Long disputeId, Long adminId) {
        log.info("Admin {} approving against for dispute {}", adminId, disputeId);

        Dispute dispute = getEntityById(disputeId);

        if (!"PENDING".equals(dispute.getStatus())
                && !"COUNTER_FILED".equals(dispute.getStatus())
                && !"ACCEPTED".equals(dispute.getStatus())
                && !"APPROVED_RAISER".equals(dispute.getStatus())) {
            throw new BadRequestException(ErrorCode.DISPUTE_INVALID_STATUS,
                    "Không thể duyệt form ở trạng thái này");
        }

        String note = String.format(
                "{\"at\":\"%s\",\"by\":%d,\"action\":\"APPROVE_AGAINST\"}",
                LocalDateTime.now(), adminId);
        appendHistory(dispute, note);

        if ("APPROVED_RAISER".equals(dispute.getStatus())) {
            dispute.setStatus("READY_TO_FINALIZE");
        } else {
            dispute.setStatus("APPROVED_AGAINST");
        }

        Dispute updated = disputeRepository.save(dispute);
        return disputeMapper.toResponse(updated);
    }

    // ===== RESOLVE =====

    @Override
    @Transactional
    public DisputeResponse resolveDispute(Long disputeId, Long adminId,
                                           String resolution, BigDecimal resolvedAmount) {
        log.info("Admin {} resolving dispute {}", adminId, disputeId);

        Dispute dispute = getEntityById(disputeId);

        if ("RESOLVED".equals(dispute.getStatus()) || "CLOSED".equals(dispute.getStatus())) {
            throw new BadRequestException(ErrorCode.DISPUTE_ALREADY_RESOLVED);
        }

        if (!"READY_TO_FINALIZE".equals(dispute.getStatus())) {
            throw new BadRequestException(ErrorCode.DISPUTE_INVALID_STATUS,
                    "Phải duyệt CẢ 2 form (Bên A + Bên B) trước khi giải quyết");
        }

        if (resolvedAmount != null) {
            if (resolvedAmount.compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                        "Số tiền bồi thường không được âm");
            }
            if (resolvedAmount.compareTo(new BigDecimal("999999999999")) > 0) {
                throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                        "Số tiền bồi thường quá lớn");
            }
        }

        if (resolution == null || resolution.trim().isEmpty()) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Kết luận không được để trống");
        }

        dispute.setResolution(resolution.trim());
        dispute.setResolvedAmount(resolvedAmount);
        dispute.setResolvedBy(adminId);
        dispute.setResolvedAt(LocalDateTime.now());
        dispute.setStatus("RESOLVED");

        try {
            String contractUrl = disputeContractService.generateContract(dispute);
            dispute.setContractUrl(contractUrl);
            dispute.setContractGeneratedAt(LocalDateTime.now());
            log.info("Contract PDF generated for dispute {}: {}",
                    dispute.getDisputeCode(), contractUrl);
        } catch (Exception e) {
            log.error("Failed to generate contract PDF for dispute {}",
                    dispute.getDisputeCode(), e);
            throw new RuntimeException("Không thể tạo hợp đồng PDF: " + e.getMessage(), e);
        }

        Dispute updated = disputeRepository.save(dispute);

        // ★ Thông báo cho 2 bên
        try {
            String msg = String.format("Tranh chấp %s đã được giải quyết. %s",
                    dispute.getDisputeCode(),
                    resolvedAmount != null ? "Bồi thường: " + resolvedAmount + "đ" : "");

            notificationService.createNotification(dispute.getRaisedBy(),
                    NotificationType.DISPUTE_RESOLVED, "Tranh chấp đã giải quyết", msg, dispute.getId());
            notificationService.createNotification(dispute.getAgainstUser(),
                    NotificationType.DISPUTE_RESOLVED, "Tranh chấp đã giải quyết", msg, dispute.getId());
        } catch (Exception e) {
            log.warn("Failed to send notifications: {}", e.getMessage());
        }

        return disputeMapper.toResponse(updated);
    }

    // ===== REQUEST EVIDENCE =====

    @Override
    @Transactional
    public DisputeResponse requestEvidence(Long disputeId, Long adminId,
                                            String target, String request) {
        log.info("Admin {} requesting evidence for dispute {} target {}",
                adminId, disputeId, target);

        Dispute dispute = getEntityById(disputeId);

        if ("RESOLVED".equals(dispute.getStatus()) || "CLOSED".equals(dispute.getStatus())) {
            throw new BadRequestException(ErrorCode.DISPUTE_ALREADY_RESOLVED,
                    "Tranh chấp đã kết thúc, không thể yêu cầu thêm bằng chứng");
        }

        if (!"RAISER".equals(target) && !"AGAINST".equals(target) && !"BOTH".equals(target)) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Target phải là RAISER, AGAINST hoặc BOTH");
        }

        dispute.setStatus("WAITING_EVIDENCE");
        dispute.setAdminRequest(request);
        dispute.setAwaitingResponseFrom(target);
        dispute.setReviewDeadlineAt(LocalDateTime.now().plusHours(24));

        Dispute updated = disputeRepository.save(dispute);

        try {
            String title = "Yêu cầu bổ sung bằng chứng";
            String content = String.format(
                    "Admin yêu cầu bổ sung bằng chứng cho tranh chấp %s trong 24h: %s",
                    dispute.getDisputeCode(), request);

            if ("RAISER".equals(target) || "BOTH".equals(target)) {
                notificationService.createNotification(dispute.getRaisedBy(),
                        NotificationType.DISPUTE_NEED_EVIDENCE, title, content, dispute.getId());
            }
            if ("AGAINST".equals(target) || "BOTH".equals(target)) {
                notificationService.createNotification(dispute.getAgainstUser(),
                        NotificationType.DISPUTE_NEED_EVIDENCE, title, content, dispute.getId());
            }
        } catch (Exception e) {
            log.warn("Failed to send notification: {}", e.getMessage());
        }

        return disputeMapper.toResponse(updated);
    }

    // ===== FINALIZE =====

    @Override
    @Transactional
    public DisputeResponse finalizeDispute(Long disputeId, Long adminId,
                                            String resolution, BigDecimal resolvedAmount) {
        log.info("Admin {} finalizing dispute {}", adminId, disputeId);

        Dispute dispute = getEntityById(disputeId);

        if (!"READY_TO_FINALIZE".equals(dispute.getStatus())) {
            throw new BadRequestException(ErrorCode.DISPUTE_INVALID_STATUS,
                    "Phải duyệt CẢ 2 form trước khi chốt PDF");
        }

        dispute.setResolution(resolution);
        dispute.setResolvedAmount(resolvedAmount);
        dispute.setResolvedBy(adminId);
        dispute.setResolvedAt(LocalDateTime.now());
        dispute.setStatus("RESOLVED");

        String contractUrl = disputeContractService.generateContract(dispute);
        dispute.setContractUrl(contractUrl);
        dispute.setContractGeneratedAt(LocalDateTime.now());

        Dispute updated = disputeRepository.save(dispute);

        try {
            String msg = String.format("Tranh chấp %s đã chốt kết quả. Tải hợp đồng tại mục Tranh chấp.",
                    dispute.getDisputeCode());

            notificationService.createNotification(dispute.getRaisedBy(),
                    NotificationType.DISPUTE_RESOLVED, "Tranh chấp đã chốt kết quả", msg, dispute.getId());
            notificationService.createNotification(dispute.getAgainstUser(),
                    NotificationType.DISPUTE_RESOLVED, "Tranh chấp đã chốt kết quả", msg, dispute.getId());
        } catch (Exception e) {
            log.warn("Failed to send notifications: {}", e.getMessage());
        }

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

    private void appendHistory(Dispute dispute, String entry) {
        String current = dispute.getEvidenceHistory();
        if (current == null || current.isBlank()) {
            dispute.setEvidenceHistory("[" + entry + "]");
        } else {
            String trimmed = current.trim();
            if (trimmed.endsWith("]")) {
                dispute.setEvidenceHistory(
                        trimmed.substring(0, trimmed.length() - 1) + "," + entry + "]");
            }
        }
    }
}