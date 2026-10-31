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

    @Test
    @DisplayName("TC19 - Test Admin không thể duyệt lại một Refund đã được xử lý")
    public void testApproveAlreadyProcessedRefund() {
        // 1. Giả lập một Refund đã được duyệt thành công (SUCCESS)
        Refund mockRefund = new Refund();
        mockRefund.setId(1L);
        mockRefund.setStatus(PaymentStatus.SUCCESS); // Đã xử lý rồi

        // Giả lập DB tìm thấy Refund này
        when(refundRepository.findById(1L)).thenReturn(Optional.of(mockRefund));

        // 2. Thực thi và Kiểm tra
        // Kỳ vọng: Hệ thống phải báo lỗi "Refund đã xử lý"
        assertThrows(BadRequestException.class, () -> {
            refundService.approveRefund(1L, 999L); // Admin ID 999 cố duyệt lại
        }, "Duyệt lại Refund đã SUCCESS phải ném ra BadRequestException");
    }
}