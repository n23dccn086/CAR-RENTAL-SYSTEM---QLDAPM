package com.carrental.booking.service;

import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.car.entity.RentalMode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.payment.repository.PaymentRepository;
import com.carrental.payment.repository.RefundRepository;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Đơn thuê kèm tài xế nhưng không có tài xế (driverId = null) vẫn phải tuân thủ kiểm tra trạng thái khi hủy.
 * Trước đây kiểm tra bị bỏ qua → đơn đã CANCELLED / COMPLETED / RETURNED có thể hủy lại và sinh thêm refund 100% cọc.
 */
@ExtendWith(MockitoExtension.class)
class BookingCancelNoDriverTest {

    @Mock BookingRepository bookingRepository;
    @Mock PaymentRepository paymentRepository;
    @Mock RefundRepository refundRepository;
    @Mock BookingDelayedQueueService delayedQueueService;

    @InjectMocks BookingServiceImpl bookingService;

    @ParameterizedTest(name = "Không hủy lại được đơn WITH_DRIVER không tài xế ở trạng thái {0}")
    @EnumSource(value = BookingStatus.class, names = {"CANCELLED", "COMPLETED", "RETURNED", "RENTED"})
    void noDriverBookingCannotBeCancelledOutsideAllowedStatuses(BookingStatus status) {
        Booking b = new Booking();
        b.setId(200L);
        b.setCustomerId(3L);
        b.setRentalMode(RentalMode.WITH_DRIVER);
        b.setDriverId(null);
        b.setDepositAmount(600_000L);
        b.setStatus(status);

        when(bookingRepository.findById(200L)).thenReturn(Optional.of(b));

        assertThrows(BadRequestException.class, () -> bookingService.cancelBooking(200L, 3L, "Không có tài xế"));
        verify(refundRepository, never()).save(any());
        verify(bookingRepository, never()).save(any());
    }
}
