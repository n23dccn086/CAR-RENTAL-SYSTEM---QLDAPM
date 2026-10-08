package com.carrental.booking.service;

import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
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
 * Scheduler tự động hủy đơn PENDING (chờ thanh toán cọc) quá 12 giờ.
 * Chạy mỗi 1 giờ.
 */
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BookingScheduler {

    BookingRepository bookingRepository;
    NotificationService notificationService;

    /** Số giờ tối đa chờ thanh toán cọc */
    static final int PENDING_TIMEOUT_HOURS = 12;

    @Scheduled(fixedDelay = 60 * 60 * 1000)  // 1 giờ
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
                // Cập nhật trạng thái
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

                log.info("[Scheduler] Auto-cancelled booking #{}", booking.getId());

            } catch (Exception e) {
                log.error("[Scheduler] Failed to auto-cancel booking #{}",
                        booking.getId(), e);
            }
        }
    }
}