package com.carrental.booking.service;

import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import com.carrental.payment.entity.Payment;
import com.carrental.payment.entity.PaymentStatus;
import com.carrental.payment.entity.PaymentType;
import com.carrental.payment.repository.PaymentRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Scheduler định kỳ kết hợp Redis Delayed Queue (lưu trên disk):
 * 1. Tự động hủy đơn PENDING (chờ cọc) quá 12 giờ.
 * 2. Quét hàng đợi Redis mỗi phút: xử lý các đơn PAID quá 4 giờ chủ xe không duyệt -> Hủy đơn + Hoàn 100% cọc.
 * 3. Khi web sập và khởi động lại: Tự động phục hồi và xử lý toàn bộ các job tồn đọng từ Redis/DB.
 */
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BookingScheduler {

    BookingRepository bookingRepository;
    BookingService bookingService;
    PaymentRepository paymentRepository;
    NotificationService notificationService;
    BookingDelayedQueueService delayedQueueService;

    /** Số giờ tối đa chờ thanh toán cọc */
    static final int PENDING_TIMEOUT_HOURS = 12;

    /** Số giờ tối đa chờ chủ xe duyệt đơn sau khi khách đã cọc */
    static final int OWNER_APPROVAL_TIMEOUT_HOURS = 4;

    /**
     * PHỤC HỒI KHI KHỞI ĐỘNG LẠI (CRASH RECOVERY):
     * Khi server sập và bật lại, lập tức kiểm tra Redis & Database để xử lý các job quá hạn trong lúc web tắt.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationStartup() {
        log.info("[Scheduler] Server started. Checking Redis delayed cancellation queue for backlogged jobs...");
        try {
            recoverAndProcessQueue();
        } catch (Exception e) {
            log.error("[Scheduler] Error during startup recovery: {}", e.getMessage(), e);
        }
    }

    public void recoverAndProcessQueue() {
        // 1. Quét ngay các job đã quá hạn trong Redis
        Set<Long> expiredFromRedis = delayedQueueService.getExpiredBookingIds();
        log.info("[Scheduler] Found {} overdue unapproved bookings in Redis on startup", expiredFromRedis.size());
        for (Long bookingId : expiredFromRedis) {
            try {
                delayedQueueService.removeScheduledCancellation(bookingId);
                bookingService.autoCancelUnapprovedBooking(bookingId);
            } catch (Exception e) {
                log.error("[Scheduler] Startup error cancelling unapproved booking #{}", bookingId, e);
            }
        }

        // 2. Đối chiếu với Database để đảm bảo tính toàn vẹn (Dual Recovery)
        List<Booking> paidBookings = bookingRepository.findByStatus(BookingStatus.PAID);
        for (Booking booking : paidBookings) {
            try {
                LocalDateTime depositTime = getDepositTime(booking);
                LocalDateTime deadline = depositTime.plusHours(OWNER_APPROVAL_TIMEOUT_HOURS);

                if (deadline.isBefore(LocalDateTime.now())) {
                    log.info("[Scheduler] Startup found booking #{} overdue in DB. Auto-cancelling...", booking.getId());
                    delayedQueueService.removeScheduledCancellation(booking.getId());
                    bookingService.autoCancelUnapprovedBooking(booking.getId());
                } else if (!delayedQueueService.isInQueue(booking.getId())) {
                    log.info("[Scheduler] Syncing active PAID booking #{} into Redis queue with deadline {}",
                            booking.getId(), deadline);
                    delayedQueueService.scheduleCancellation(booking.getId(), deadline);
                }
            } catch (Exception e) {
                log.error("[Scheduler] Startup error syncing booking #{} with Redis: {}", booking.getId(), e.getMessage());
            }
        }
    }

    /**
     * CRONJOB QUÉT REDIS HÀNG PHÚT:
     * Lấy các job hết hạn từ Redis ZSET và thực hiện hủy đơn + hoàn cọc 100%.
     */
    @Scheduled(fixedDelay = 60 * 1000)  // Chạy mỗi 1 phút
    public void processDelayedCancellationQueue() {
        try {
            Set<Long> expiredBookingIds = delayedQueueService.getExpiredBookingIds();
            if (expiredBookingIds == null || expiredBookingIds.isEmpty()) {
                return;
            }

            log.info("[Scheduler] Found {} expired unapproved bookings in Redis queue", expiredBookingIds.size());

            for (Long bookingId : expiredBookingIds) {
                try {
                    delayedQueueService.removeScheduledCancellation(bookingId);
                    bookingService.autoCancelUnapprovedBooking(bookingId);
                } catch (Exception e) {
                    log.error("[Scheduler] Error auto-cancelling unapproved booking #{}", bookingId, e);
                }
            }
        } catch (Exception e) {
            log.warn("[Scheduler] Redis check failed, falling back to database: {}", e.getMessage());
            fallbackDatabaseScan();
        }
    }

    /**
     * Fallback quét Database nếu Redis tạm thời mất kết nối
     */
    private void fallbackDatabaseScan() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(OWNER_APPROVAL_TIMEOUT_HOURS);
        List<Booking> paidBookings = bookingRepository.findByStatus(BookingStatus.PAID);
        for (Booking booking : paidBookings) {
            try {
                LocalDateTime depositTime = getDepositTime(booking);
                if (depositTime != null && depositTime.isBefore(cutoff)) {
                    log.info("[Scheduler-Fallback] Auto-cancelling overdue booking #{}", booking.getId());
                    bookingService.autoCancelUnapprovedBooking(booking.getId());
                }
            } catch (Exception e) {
                log.error("[Scheduler-Fallback] Error cancelling booking #{}", booking.getId(), e);
            }
        }
    }

    /**
     * Helper xác định thời điểm khách đã cọc
     */
    private LocalDateTime getDepositTime(Booking booking) {
        Payment depositPayment = paymentRepository.findByBookingId(booking.getId()).stream()
                .filter(p -> (p.getPaymentType() == null || p.getPaymentType() == PaymentType.DEPOSIT)
                        && p.getStatus() == PaymentStatus.SUCCESS)
                .findFirst()
                .orElseGet(() -> paymentRepository.findByBookingIdAndStatus(booking.getId(), PaymentStatus.SUCCESS).orElse(null));

        return (depositPayment != null && depositPayment.getPaidAt() != null)
                ? depositPayment.getPaidAt()
                : (booking.getUpdatedAt() != null ? booking.getUpdatedAt() : booking.getCreatedAt());
    }

    /**
     * Tự động hủy đơn PENDING (chờ cọc) quá 12 giờ.
     */
    @Scheduled(fixedDelay = 5 * 60 * 1000)  // Quét mỗi 5 phút
    @Transactional
    public void autoCancelExpiredBookings() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(PENDING_TIMEOUT_HOURS);

        List<Booking> expiredBookings = bookingRepository
                .findByStatusAndCreatedAtBefore(BookingStatus.PENDING, cutoff);

        if (expiredBookings.isEmpty()) {
            return;
        }

        log.info("[Scheduler] Found {} expired PENDING bookings", expiredBookings.size());

        for (Booking booking : expiredBookings) {
            try {
                booking.setStatus(BookingStatus.CANCELLED);
                booking.setCancelReason(
                        "Tự động hủy: Khách không thanh toán cọc trong " +
                        PENDING_TIMEOUT_HOURS + " giờ"
                );
                booking.setCancelledAt(LocalDateTime.now());
                bookingRepository.save(booking);

                // Gửi thông báo cho KHÁCH
                try {
                    notificationService.createNotification(
                            booking.getCustomerId(),
                            NotificationType.BOOKING_CANCELLED,
                            "Đơn đã tự động hủy",
                            String.format(
                                    "Đơn #%d đã tự động hủy do không thanh toán cọc trong %d giờ. " +
                                    "Bạn có thể tạo đơn mới nếu vẫn muốn thuê xe.",
                                    booking.getId(),
                                    PENDING_TIMEOUT_HOURS
                            ),
                            booking.getId()
                    );
                } catch (Exception e) {
                    log.warn("Failed to notify customer: {}", e.getMessage());
                }

                // Gửi thông báo cho CHỦ XE
                try {
                    notificationService.createNotification(
                            booking.getOwnerId(),
                            NotificationType.BOOKING_CANCELLED,
                            "Đơn đã tự động hủy",
                            String.format(
                                    "Đơn #%d đã tự động hủy do khách không thanh toán cọc trong %d giờ.",
                                    booking.getId(),
                                    PENDING_TIMEOUT_HOURS
                            ),
                            booking.getId()
                    );
                } catch (Exception e) {
                    log.warn("Failed to notify owner: {}", e.getMessage());
                }

                log.info("[Scheduler] Auto-cancelled PENDING booking #{}", booking.getId());

            } catch (Exception e) {
                log.error("[Scheduler] Failed to auto-cancel PENDING booking #{}",
                        booking.getId(), e);
            }
        }
    }
}
