package com.carrental.booking.service;

import com.carrental.booking.dto.BookingRequest;
import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.car.entity.RentalMode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.payment.repository.PaymentRepository;
import com.carrental.user.entity.User;
import com.carrental.user.entity.VerificationStatus;
import com.carrental.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class BookingServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private BookingDelayedQueueService delayedQueueService; // <--- DÒNG QUAN TRỌNG BỊ THIẾU

    @InjectMocks
    private BookingServiceImpl bookingService;

    @Test
    @DisplayName("TC11 - Test chặn đặt xe tự lái khi chưa xác thực KYC")
    public void testCreateBookingWithoutKyc() {
        Long customerId = 3L;
        BookingRequest request = new BookingRequest();
        request.setRentalMode(RentalMode.SELF_DRIVE);

        User mockCustomer = new User();
        mockCustomer.setId(customerId);
        mockCustomer.setVerificationStatus(VerificationStatus.UNVERIFIED);

        when(userRepository.findById(customerId)).thenReturn(Optional.of(mockCustomer));

        assertThrows(BadRequestException.class, () -> {
            bookingService.createBooking(customerId, request);
        }, "Đặt xe tự lái khi chưa KYC phải bị chặn với BadRequestException");
    }

    @Test
    @DisplayName("TC09 - Test chặn hủy đơn khi đơn đã COMPLETED")
    public void testCancelCompletedBooking() {
        Booking mockBooking = new Booking();
        mockBooking.setId(100L);
        mockBooking.setStatus(BookingStatus.COMPLETED);
        mockBooking.setCustomerId(3L);

        when(bookingRepository.findById(100L)).thenReturn(Optional.of(mockBooking));

        assertThrows(BadRequestException.class, () -> {
            bookingService.cancelBooking(100L, 3L, "Đổi ý");
        }, "Không được phép hủy đơn đã hoàn tất");
    }

    @Test
    @DisplayName("TC - Test logic tự động hủy đơn PAID quá 4h chưa duyệt")
    public void testAutoCancelUnapprovedBooking() {
        Booking mockBooking = new Booking();
        mockBooking.setId(101L);
        mockBooking.setStatus(BookingStatus.PAID);
        mockBooking.setDepositAmount(300000L);
        mockBooking.setCustomerId(3L);
        mockBooking.setOwnerId(2L);

        when(bookingRepository.findById(101L)).thenReturn(Optional.of(mockBooking));
        when(paymentRepository.findByBookingId(101L)).thenReturn(java.util.Collections.emptyList());

        assertDoesNotThrow(() -> {
            bookingService.autoCancelUnapprovedBooking(101L);
        }, "Hàm tự động hủy đơn không được phép crash");
    }
}