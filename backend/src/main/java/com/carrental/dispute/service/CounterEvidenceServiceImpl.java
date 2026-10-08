package com.carrental.dispute.service;

import com.carrental.admin.dto.DisputeMapper;
import com.carrental.admin.dto.DisputeResponse;
import com.carrental.admin.entity.Dispute;
import com.carrental.admin.repository.DisputeRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.dispute.dto.CounterEvidenceRequest;
import com.carrental.dispute.dto.ReviewRequest;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import com.carrental.user.entity.Role;
import com.carrental.user.entity.User;
import com.carrental.user.repository.UserRepository;
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
public class CounterEvidenceServiceImpl implements CounterEvidenceService {

    DisputeRepository disputeRepository;
    DisputeMapper disputeMapper;
    NotificationService notificationService;
    UserRepository userRepository;

    // ===== ACCEPT (khách đồng ý) =====

    @Override
    @Transactional
    public DisputeResponse acceptDispute(Long disputeId, Long userId) {
        log.info("User {} accepting dispute {}", userId, disputeId);

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DISPUTE_NOT_FOUND));

        if (!dispute.getAgainstUser().equals(userId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Chỉ người bị kiện mới có thể xác nhận");
        }

        if (!"PENDING".equals(dispute.getStatus())) {
            throw new BadRequestException(ErrorCode.DISPUTE_INVALID_STATUS,
                    "Không thể xác nhận ở trạng thái này");
        }

        dispute.setStatus("ACCEPTED");
        dispute.setCounterFiledAt(LocalDateTime.now());
        dispute.setCounterDeadlineAt(null);
        Dispute updated = disputeRepository.save(dispute);

        // ★ Thông báo cho người tạo
        try {
            notificationService.createNotification(
                    dispute.getRaisedBy(),
                    NotificationType.DISPUTE_ACCEPTED,
                    "Khách đã xác nhận tranh chấp",
                    String.format("Khách đã đồng ý với tranh chấp %s.", dispute.getDisputeCode()),
                    dispute.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to send notification: {}", e.getMessage());
        }

        // ★ Thông báo cho tất cả Admin
        try {
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            for (User admin : admins) {
                notificationService.createNotification(
                        admin.getId(),
                        NotificationType.DISPUTE_ACCEPTED,
                        "Tranh chấp đã được chấp nhận",
                        String.format("Khách đã đồng ý với tranh chấp %s. Vui lòng duyệt tiếp.",
                                dispute.getDisputeCode()),
                        dispute.getId()
                );
            }
        } catch (Exception e) {
            log.warn("Failed to notify admins: {}", e.getMessage());
        }

        return disputeMapper.toResponse(updated);
    }

    // ===== COUNTER EVIDENCE (phản bác) =====

    @Override
    @Transactional
    public DisputeResponse fileCounterEvidence(Long disputeId, Long userId, CounterEvidenceRequest request) {
        log.info("User {} filing counter evidence for dispute {}", userId, disputeId);

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DISPUTE_NOT_FOUND));

        if (!dispute.getAgainstUser().equals(userId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Chỉ người bị kiện mới có thể phản bác");
        }

        if (!"PENDING".equals(dispute.getStatus())) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Không thể phản bác ở trạng thái này");
        }

        if (dispute.getCounterDeadlineAt() != null
                && LocalDateTime.now().isAfter(dispute.getCounterDeadlineAt())) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Đã hết hạn phản bác");
        }

        dispute.setCounterDescription(request.getDescription().trim());
        dispute.setCounterEvidence(request.getEvidence());
        dispute.setCounterFiledAt(LocalDateTime.now());
        dispute.setCounterDeadlineAt(null);
        dispute.setStatus("COUNTER_FILED");

        Dispute updated = disputeRepository.save(dispute);

        // ★ Thông báo cho người tạo
        try {
            notificationService.createNotification(
                    dispute.getRaisedBy(),
                    NotificationType.DISPUTE_COUNTER_FILED,
                    "Khách hàng đã phản bác",
                    String.format("Khách hàng đã phản bác tranh chấp %s. Admin sẽ xem xét.",
                            dispute.getDisputeCode()),
                    dispute.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to send notification: {}", e.getMessage());
        }

        // ★ Thông báo cho tất cả Admin
        try {
            List<User> admins = userRepository.findByRole(Role.ADMIN);
            for (User admin : admins) {
                notificationService.createNotification(
                        admin.getId(),
                        NotificationType.DISPUTE_COUNTER_FILED,
                        "Khách đã phản bác tranh chấp",
                        String.format("Tranh chấp %s đã được khách phản bác. Vui lòng xem xét.",
                                dispute.getDisputeCode()),
                        dispute.getId()
                );
            }
        } catch (Exception e) {
            log.warn("Failed to notify admins: {}", e.getMessage());
        }

        log.info("Counter evidence filed for dispute {}, status: COUNTER_FILED", disputeId);
        return disputeMapper.toResponse(updated);
    }

    // ===== SUBMIT REVIEW (bổ sung khi admin yêu cầu) =====

    @Override
    @Transactional
    public DisputeResponse submitReview(Long disputeId, Long userId, ReviewRequest request) {
        log.info("User {} submitting review for dispute {}", userId, disputeId);

        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DISPUTE_NOT_FOUND));

        boolean isRaiser = dispute.getRaisedBy().equals(userId);
        boolean isAgainst = dispute.getAgainstUser().equals(userId);
        if (!isRaiser && !isAgainst) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED);
        }

        if (!"WAITING_EVIDENCE".equals(dispute.getStatus())) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Không thể bổ sung ở trạng thái này");
        }

        String awaiting = dispute.getAwaitingResponseFrom();
        if ("RAISER".equals(awaiting) && !isRaiser) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Đang chờ người tạo tranh chấp bổ sung, không phải bạn");
        }
        if ("AGAINST".equals(awaiting) && !isAgainst) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Đang chờ người bị kiện bổ sung, không phải bạn");
        }

        if (dispute.getReviewDeadlineAt() != null
                && LocalDateTime.now().isAfter(dispute.getReviewDeadlineAt())) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Đã hết hạn bổ sung thông tin");
        }

        if (isRaiser) {
            dispute.setDescription(request.getDescription().trim());
            if (request.getEvidence() != null && !request.getEvidence().isBlank()) {
                dispute.setEvidence(request.getEvidence());
            }
        } else {
            dispute.setCounterDescription(request.getDescription().trim());
            if (request.getEvidence() != null && !request.getEvidence().isBlank()) {
                dispute.setCounterEvidence(request.getEvidence());
            }
        }

        if (request.getUserNote() != null && !request.getUserNote().isBlank()) {
            appendHistoryEntry(dispute, userId, request.getUserNote());
        }

        dispute.setStatus("PENDING");
        dispute.setAdminRequest(null);
        dispute.setAwaitingResponseFrom(null);
        dispute.setReviewDeadlineAt(null);
        dispute.setLastSubmittedAt(LocalDateTime.now());

        Dispute updated = disputeRepository.save(dispute);

        log.info("Review submitted for dispute {}, status reset to PENDING", disputeId);
        return disputeMapper.toResponse(updated);
    }

    // ===== HELPER =====

    private void appendHistoryEntry(Dispute dispute, Long userId, String note) {
        try {
            String entry = String.format(
                    "{\"at\":\"%s\",\"by\":%d,\"note\":\"%s\"}",
                    LocalDateTime.now(),
                    userId,
                    note.replace("\"", "'").replace("\n", " ").replace("\r", ""));
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
        } catch (Exception e) {
            log.warn("appendHistoryEntry failed: {}", e.getMessage());
        }
    }
}