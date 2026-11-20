package com.carrental.booking.service;

import com.carrental.admin.service.ConfigHelper;
import com.carrental.booking.dto.BookingMapper;
import com.carrental.booking.dto.BookingResponse;
import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.car.entity.RentalMode;
import com.carrental.car.repository.CarRepository;
import com.carrental.driver.repository.DriverAssignmentRepository;
import com.carrental.handover.repository.HandoverRecordRepository;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import com.carrental.payment.entity.Payment;
import com.carrental.payment.repository.PaymentRepository;
import com.carrental.payment.repository.RefundRepository;
import com.carrental.user.entity.Role;
import com.carrental.user.entity.User;
import com.carrental.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Thông báo hoàn tiền khi hủy đơn:
 * - Đơn chưa cọc (PENDING) hủy → admin KHÔNG nhận "Yêu cầu hoàn tiền", không ai nhận câu "hoàn 0đ".
 * - Đơn đã cọc và tạo được Refund → admin nhận REFUND_REQUESTED.
 * - Đơn đã cọc nhưng chính sách hoàn 0% → không báo admin, chủ xe không bị báo sai "khách chưa cọc".
 * - Đơn cần hoàn nhưng không có giao dịch cọc SUCCESS → admin nhận SYSTEM (xử lý thủ công), không phải REFUND_REQUESTED.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BookingRefundNotificationTest {

    static final long BOOKING_ID = 300L;
    static final long OWNER_ID = 2L;
    static final long CUSTOMER_ID = 3L;
    static final long ADMIN_ID = 99L;

    @Mock BookingRepository bookingRepository;
    @Mock CarRepository carRepository;
    @Mock UserRepository userRepository;
    @Mock BookingMapper bookingMapper;
    @Mock PaymentRepository paymentRepository;
    @Mock RefundRepository refundRepository;
    @Mock NotificationService notificationService;
    @Mock HandoverRecordRepository handoverRepository;
    @Mock ConfigHelper configHelper;
    @Mock DriverAssignmentRepository driverAssignmentRepository;
    @Mock BookingDelayedQueueService delayedQueueService;

    @InjectMocks BookingServiceImpl bookingService;

    Booking booking;

    @BeforeEach
    void setUp() {
        booking = new Booking();
        booking.setId(BOOKING_ID);
        booking.setOwnerId(OWNER_ID);
        booking.setCustomerId(CUSTOMER_ID);
        booking.setCarId(5L);
        booking.setRentalMode(RentalMode.SELF_DRIVE);
        booking.setDepositAmount(600_000L);
        booking.setTotalPrice(2_000_000L);
        booking.setStartDate(LocalDateTime.now().plusDays(3));
        booking.setEndDate(LocalDateTime.now().plusDays(5));

        when(bookingRepository.findById(BOOKING_ID)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));
        when(bookingMapper.toResponse(any())).thenAnswer(inv -> new BookingResponse());

        User admin = new User();
        admin.setId(ADMIN_ID);
        admin.setRole(Role.ADMIN);
        when(userRepository.findByRole(Role.ADMIN)).thenReturn(List.of(admin));

        when(configHelper.getRefundBefore24hPercent()).thenReturn(new BigDecimal("100"));
    }

    private void givenDepositPaymentExists() {
        Payment payment = mock(Payment.class);
        when(payment.getId()).thenReturn(7L);
        when(paymentRepository.findByBookingIdAndStatus(eq(BOOKING_ID), any())).thenReturn(Optional.of(payment));
        when(paymentRepository.findByBookingId(BOOKING_ID)).thenReturn(List.of(payment));
    }

    private void verifyAdminNotNotified() {
        verify(notificationService, never()).createNotification(eq(ADMIN_ID), any(), any(), any(), any());
    }

    private String messageSentTo(long userId) {
        ArgumentCaptor<String> msg = ArgumentCaptor.forClass(String.class);
        verify(notificationService, atLeastOnce()).createNotification(eq(userId), any(), any(), msg.capture(), any());
        return String.join(" | ", msg.getAllValues());
    }

    // ===== Khách tự hủy =====

    @Test
    @DisplayName("Khách hủy đơn chưa cọc → admin không nhận yêu cầu hoàn tiền, chủ xe được báo 'chưa thanh toán cọc'")
    void customerCancelUnpaid_noAdminRefundNotification() {
        booking.setStatus(BookingStatus.PENDING);

        bookingService.cancelBooking(BOOKING_ID, CUSTOMER_ID, "đổi ý");

        verifyAdminNotNotified();
        verify(refundRepository, never()).save(any());
        String ownerMsg = messageSentTo(OWNER_ID);
        assertTrue(ownerMsg.contains("chưa thanh toán cọc"), ownerMsg);
        assertTrue(!ownerMsg.contains("0đ"), ownerMsg);
    }

    @Test
    @DisplayName("Khách hủy đơn đã cọc, tạo được Refund → admin nhận REFUND_REQUESTED, số tiền định dạng vi-VN")
    void customerCancelPaid_adminGetsRefundRequested() {
        booking.setStatus(BookingStatus.PAID);
        givenDepositPaymentExists();

        bookingService.cancelBooking(BOOKING_ID, CUSTOMER_ID, "đổi ý");

        verify(refundRepository).save(any());
        verify(notificationService).createNotification(eq(ADMIN_ID), eq(NotificationType.REFUND_REQUESTED),
                any(), contains("600.000đ"), eq(BOOKING_ID));
        assertTrue(messageSentTo(OWNER_ID).contains("Hoàn cọc: 600.000đ."));
    }

    @Test
    @DisplayName("Khách hủy đơn đã cọc nhưng chính sách hoàn 0% → không báo admin, chủ xe không bị báo sai 'chưa cọc'")
    void customerCancelPaid_zeroPercentPolicy() {
        booking.setStatus(BookingStatus.PAID);
        givenDepositPaymentExists();
        when(configHelper.getRefundBefore24hPercent()).thenReturn(BigDecimal.ZERO);

        bookingService.cancelBooking(BOOKING_ID, CUSTOMER_ID, "đổi ý");

        verifyAdminNotNotified();
        String ownerMsg = messageSentTo(OWNER_ID);
        assertTrue(ownerMsg.contains("không được hoàn cọc"), ownerMsg);
        assertTrue(!ownerMsg.contains("chưa thanh toán cọc"), ownerMsg);
    }

    @Test
    @DisplayName("Khách hủy đơn cần hoàn nhưng không có giao dịch cọc SUCCESS → admin nhận SYSTEM, không phải REFUND_REQUESTED")
    void customerCancelPaid_noPaymentRecord_adminGetsManualCheck() {
        booking.setStatus(BookingStatus.PAID);

        bookingService.cancelBooking(BOOKING_ID, CUSTOMER_ID, "đổi ý");

        verify(refundRepository, never()).save(any());
        verify(notificationService, never()).createNotification(eq(ADMIN_ID), eq(NotificationType.REFUND_REQUESTED), any(), any(), any());
        verify(notificationService).createNotification(eq(ADMIN_ID), eq(NotificationType.SYSTEM), any(), contains("600.000đ"), eq(BOOKING_ID));
    }

    // ===== Chủ xe hủy =====

    @Test
    @DisplayName("Chủ xe hủy đơn chưa cọc → admin không nhận yêu cầu hoàn tiền, khách không nhận câu 'HOÀN 100% cọc (0đ)'")
    void ownerRejectUnpaid_noAdminRefundNotification() {
        booking.setStatus(BookingStatus.PENDING);

        bookingService.rejectBooking(BOOKING_ID, OWNER_ID, "xe hỏng");

        verifyAdminNotNotified();
        String customerMsg = messageSentTo(CUSTOMER_ID);
        assertTrue(customerMsg.contains("chưa thanh toán cọc"), customerMsg);
        assertTrue(!customerMsg.contains("HOÀN 100%"), customerMsg);
    }

    @Test
    @DisplayName("Chủ xe hủy đơn đã cọc → admin nhận REFUND_REQUESTED, khách được báo hoàn 100%")
    void ownerRejectPaid_adminGetsRefundRequested() {
        booking.setStatus(BookingStatus.APPROVED);
        givenDepositPaymentExists();

        bookingService.rejectBooking(BOOKING_ID, OWNER_ID, "xe hỏng");

        verify(notificationService).createNotification(eq(ADMIN_ID), eq(NotificationType.REFUND_REQUESTED),
                any(), contains("600.000đ"), eq(BOOKING_ID));
        assertTrue(messageSentTo(CUSTOMER_ID).contains("HOÀN 100% cọc (600.000đ)"));
    }

    @Test
    @DisplayName("Chủ xe hủy đơn PAID có depositAmount = null → không NullPointerException")
    void ownerRejectPaid_nullDeposit_noNpe() {
        booking.setStatus(BookingStatus.PAID);
        booking.setDepositAmount(null);

        bookingService.rejectBooking(BOOKING_ID, OWNER_ID, "xe hỏng");

        verifyAdminNotNotified();
    }

    // ===== Tự động hủy do chủ xe không duyệt =====

    @Test
    @DisplayName("Tự hủy đơn PAID không có giao dịch cọc SUCCESS → admin nhận SYSTEM, không phải REFUND_REQUESTED")
    void autoCancel_noPaymentRecord_adminGetsManualCheck() {
        booking.setStatus(BookingStatus.PAID);

        bookingService.autoCancelUnapprovedBooking(BOOKING_ID);

        verify(notificationService, never()).createNotification(eq(ADMIN_ID), eq(NotificationType.REFUND_REQUESTED), any(), any(), any());
        verify(notificationService).createNotification(eq(ADMIN_ID), eq(NotificationType.SYSTEM), any(), any(), eq(BOOKING_ID));
    }

    @Test
    @DisplayName("Tự hủy đơn PAID có giao dịch cọc → admin nhận REFUND_REQUESTED")
    void autoCancel_withPayment_adminGetsRefundRequested() {
        booking.setStatus(BookingStatus.PAID);
        givenDepositPaymentExists();

        bookingService.autoCancelUnapprovedBooking(BOOKING_ID);

        verify(refundRepository).save(any());
        verify(notificationService).createNotification(eq(ADMIN_ID), eq(NotificationType.REFUND_REQUESTED), any(), any(), eq(BOOKING_ID));
    }
}
