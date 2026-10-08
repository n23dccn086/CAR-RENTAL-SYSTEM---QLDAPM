package com.carrental.payment.service;

import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import com.carrental.payment.dto.RefundMapper;
import com.carrental.payment.dto.RefundResponse;
import com.carrental.payment.entity.PaymentStatus;
import com.carrental.payment.entity.Refund;
import com.carrental.payment.repository.PaymentRepository;
import com.carrental.payment.repository.RefundRepository;
import com.carrental.booking.entity.Booking;
import com.carrental.booking.repository.BookingRepository;
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
    NotificationService notificationService;
    BookingRepository bookingRepository;

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

        // ★ MỚI: Thông báo cho Customer
        try {
            Booking booking = bookingRepository.findById(refund.getBookingId()).orElse(null);
            if (booking != null) {
                notificationService.createNotification(
                        booking.getCustomerId(),
                        NotificationType.REFUND_SUCCESS,
                        "Hoàn tiền thành công",
                        String.format("Yêu cầu hoàn tiền %sđ cho đơn #%d đã được duyệt.",
                                formatMoney(refund.getAmount()), refund.getBookingId()),
                        refund.getId()
                );
            }
        } catch (Exception e) {
            log.warn("Failed to notify customer: {}", e.getMessage());
        }

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

        // ★ MỚI: Thông báo cho Customer
        try {
            Booking booking = bookingRepository.findById(refund.getBookingId()).orElse(null);
            if (booking != null) {
                notificationService.createNotification(
                        booking.getCustomerId(),
                        NotificationType.REFUND_REJECTED,
                        "Hoàn tiền bị từ chối",
                        String.format("Yêu cầu hoàn tiền %sđ cho đơn #%d bị từ chối. Lý do: %s.",
                                formatMoney(refund.getAmount()), refund.getBookingId(),
                                reason != null ? reason : "Không có lý do"),
                        refund.getId()
                );
            }
        } catch (Exception e) {
            log.warn("Failed to notify customer: {}", e.getMessage());
        }

        return refundMapper.toResponse(updated);
    }

    @Override
    public long countPending() {
        return refundRepository.countByStatus(PaymentStatus.PENDING);
    }

    private String formatMoney(Long amount) {
        if (amount == null) return "0";
        return String.format("%,d", amount);
    }
}