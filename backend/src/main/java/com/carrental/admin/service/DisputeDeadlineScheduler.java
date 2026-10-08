package com.carrental.admin.service;

import com.carrental.admin.entity.Dispute;
import com.carrental.admin.repository.DisputeRepository;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduler quét deadline của tranh chấp — chạy mỗi 5 phút.
 *
 * Có 2 loại deadline:
 *  1. counter_deadline_at (48h): bên bị kiện không phản hồi → coi như CHẤP NHẬN (ACCEPTED)
 *  2. review_deadline_at (24h): bên được yêu cầu không bổ sung bằng chứng → quay về PENDING
 *     để admin duyệt dựa trên bằng chứng hiện có.
 */
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class DisputeDeadlineScheduler {

    DisputeRepository disputeRepository;
    NotificationService notificationService;

    // ============================================================
    // 1. DEADLINE PHẢN BÁC (48h) — PENDING → ACCEPTED
    // ============================================================
    @Scheduled(fixedDelay = 5 * 60 * 1000)
    @Transactional
    public void checkCounterDeadline() {
        LocalDateTime now = LocalDateTime.now();

        List<Dispute> expired = disputeRepository
                .findByStatusAndCounterDeadlineAtBefore("PENDING", now);

        if (expired.isEmpty()) return;

        log.info("[Scheduler] Found {} disputes with expired counter deadline", expired.size());

        for (Dispute dispute : expired) {
            try {
                dispute.setStatus("ACCEPTED");
                dispute.setCounterFiledAt(now);
                dispute.setCounterDescription("[Hệ thống] Khách không phản hồi trong 48h");
                dispute.setCounterDeadlineAt(null);
                disputeRepository.save(dispute);

                log.info("[Scheduler] Dispute {} counter deadline expired -> ACCEPTED",
                        dispute.getDisputeCode());

                // ★ Notify cả 2 bên — dùng type DISPUTE_DEADLINE_WARNING
                try {
                    String msg = String.format(
                            "Tranh chấp %s: Khách không phản hồi trong 48h. Coi như chấp nhận.",
                            dispute.getDisputeCode());
                    notificationService.createNotification(dispute.getRaisedBy(),
                            NotificationType.DISPUTE_DEADLINE_WARNING,
                            "Hết hạn phản bác", msg, dispute.getId());
                    notificationService.createNotification(dispute.getAgainstUser(),
                            NotificationType.DISPUTE_DEADLINE_WARNING,
                            "Hết hạn phản bác", msg, dispute.getId());
                } catch (Exception e) {
                    log.warn("[Scheduler] Failed to send notification: {}", e.getMessage());
                }

            } catch (Exception e) {
                log.error("[Scheduler] Error processing expired counter deadline for dispute {}",
                        dispute.getId(), e);
            }
        }
    }

    // ============================================================
    // 2. DEADLINE BỔ SUNG BẰNG CHỨNG (24h) — WAITING_EVIDENCE → PENDING
    // ============================================================
    @Scheduled(fixedDelay = 5 * 60 * 1000)
    @Transactional
    public void checkReviewDeadline() {
        LocalDateTime now = LocalDateTime.now();

        List<Dispute> expired = disputeRepository
                .findByStatusAndReviewDeadlineAtBefore("WAITING_EVIDENCE", now);

        if (expired.isEmpty()) return;

        log.info("[Scheduler] Found {} disputes with expired review deadline", expired.size());

        for (Dispute dispute : expired) {
            try {
                dispute.setStatus("PENDING");
                dispute.setAdminRequest(null);
                dispute.setAwaitingResponseFrom(null);
                dispute.setReviewDeadlineAt(null);

                appendSystemNote(dispute,
                        "[Hệ thống] Hết hạn bổ sung — admin duyệt dựa trên bằng chứng hiện có");

                disputeRepository.save(dispute);

                log.warn("[Scheduler] Dispute {} review deadline expired -> PENDING",
                        dispute.getDisputeCode());

                // ★ Notify cả 2 bên — dùng type DISPUTE_DEADLINE_WARNING
                try {
                    String msg = String.format(
                            "Tranh chấp %s: Hết hạn bổ sung bằng chứng. Admin sẽ duyệt dựa trên thông tin hiện có.",
                            dispute.getDisputeCode());
                    notificationService.createNotification(dispute.getRaisedBy(),
                            NotificationType.DISPUTE_DEADLINE_WARNING,
                            "Hết hạn bổ sung", msg, dispute.getId());
                    notificationService.createNotification(dispute.getAgainstUser(),
                            NotificationType.DISPUTE_DEADLINE_WARNING,
                            "Hết hạn bổ sung", msg, dispute.getId());
                } catch (Exception e) {
                    log.warn("[Scheduler] Failed to send notification: {}", e.getMessage());
                }

            } catch (Exception e) {
                log.error("[Scheduler] Error processing expired review deadline for dispute {}",
                        dispute.getId(), e);
            }
        }
    }

    private void appendSystemNote(Dispute dispute, String note) {
        try {
            String entry = String.format(
                    "{\"at\":\"%s\",\"by\":\"SYSTEM\",\"note\":\"%s\"}",
                    LocalDateTime.now(),
                    note.replace("\"", "'"));
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
            log.warn("[Scheduler] appendSystemNote failed: {}", e.getMessage());
        }
    }
}