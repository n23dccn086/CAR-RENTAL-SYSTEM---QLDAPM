package com.carrental.payment.service;

import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.payment.dto.PaymentMapper;
import com.carrental.payment.dto.PaymentRequest;
import com.carrental.payment.dto.PaymentResponse;
import com.carrental.payment.entity.Payment;
import com.carrental.payment.entity.PaymentMethod;
import com.carrental.payment.entity.PaymentType;
import com.carrental.payment.repository.PaymentRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Số tiền thanh toán phải do server tính, không lấy theo client
 * (trước đây client cộng phí vượt km/trễ 2 lần vào số tiền thanh toán nốt).
 */
@ExtendWith(MockitoExtension.class)
class PaymentAmountTest {

    @Mock PaymentRepository paymentRepository;
    @Mock com.carrental.payment.repository.RefundRepository refundRepository;
    @Mock BookingRepository bookingRepository;
    @Mock com.carrental.user.repository.UserRepository userRepository;
    @Mock PaymentMapper paymentMapper;
    @Mock com.carrental.payment.gateway.MomoGateway momoGateway;
    @Mock com.carrental.notification.service.NotificationService notificationService;
    @Mock com.carrental.car.repository.CarRepository carRepository;
    @Mock com.carrental.booking.service.BookingDelayedQueueService delayedQueueService;

    @InjectMocks PaymentServiceImpl paymentService;

    private Long createAndCaptureAmount(Booking booking, PaymentType type, long clientAmount) {
        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(paymentMapper.toResponse(any(Payment.class))).thenReturn(new PaymentResponse());

        PaymentRequest req = new PaymentRequest();
        req.setBookingId(booking.getId());
        req.setPaymentType(type);
        req.setPaymentMethod(PaymentMethod.BANKING);
        req.setAmount(clientAmount);

        paymentService.createPayment(booking.getCustomerId(), req);

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository, atLeastOnce()).save(captor.capture());
        return captor.getAllValues().get(0).getAmount();
    }

    @Test
    @DisplayName("PAY1 - Thanh toán nốt = remainingAmount (đã gồm phí vượt km), bỏ qua số client cộng thêm")
    void remainingUsesServerAmount() {
        // Thuê 2.000.000, cọc 600.000, phí vượt km 890.000 đã được cộng khi ký biên bản trả xe
        Booking b = new Booking();
        b.setId(1L);
        b.setCustomerId(7L);
        b.setStatus(BookingStatus.RETURNED);
        b.setTotalPrice(2_890_000L);
        b.setDepositAmount(600_000L);
        b.setRemainingAmount(2_290_000L);

        // Client cũ: (total - deposit) + totalExtraFees = 2.290.000 + 890.000 → cộng phí 2 lần
        Long amount = createAndCaptureAmount(b, PaymentType.REMAINING, 3_180_000L);
        assertEquals(2_290_000L, amount);
    }

    @Test
    @DisplayName("PAY2 - Thanh toán cọc = depositAmount của booking")
    void depositUsesServerAmount() {
        Booking b = new Booking();
        b.setId(2L);
        b.setCustomerId(7L);
        b.setStatus(BookingStatus.PENDING);
        b.setTotalPrice(2_000_000L);
        b.setDepositAmount(600_000L);

        Long amount = createAndCaptureAmount(b, PaymentType.DEPOSIT, 1L);
        assertEquals(600_000L, amount);
    }
}
