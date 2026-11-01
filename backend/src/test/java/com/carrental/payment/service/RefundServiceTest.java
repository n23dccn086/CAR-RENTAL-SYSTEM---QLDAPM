package com.carrental.payment.service;

import com.carrental.common.exception.BadRequestException;
import com.carrental.payment.entity.PaymentStatus;
import com.carrental.payment.entity.Refund;
import com.carrental.payment.repository.RefundRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class RefundServiceTest {

    @Mock
    private RefundRepository refundRepository;

    @Mock
    private com.carrental.payment.dto.RefundMapper refundMapper;

    @Mock
    private com.carrental.notification.service.NotificationService notificationService;

    @Mock
    private com.carrental.booking.repository.BookingRepository bookingRepository;

    @InjectMocks
    private RefundServiceImpl refundService;

    // ===== TEST 1: Chặn duyệt lại Refund đã xử lý =====
    @Test
    @DisplayName("TC19 - Test Admin không thể duyệt lại một Refund đã được xử lý")
    public void testApproveAlreadyProcessedRefund() {
        Refund mockRefund = new Refund();
        mockRefund.setId(1L);
        mockRefund.setStatus(PaymentStatus.SUCCESS);

        when(refundRepository.findById(1L)).thenReturn(Optional.of(mockRefund));

        assertThrows(BadRequestException.class, () -> {
            refundService.approveRefund(1L, 999L);
        }, "Duyệt lại Refund đã SUCCESS phải ném ra BadRequestException");
    }
}