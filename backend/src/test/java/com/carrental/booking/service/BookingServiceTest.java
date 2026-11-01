package com.carrental.booking.service;

import com.carrental.booking.dto.BookingRequest;
import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.car.entity.Car;
import com.carrental.car.entity.CarStatus;
import com.carrental.car.entity.RentalMode;
import com.carrental.car.repository.CarRepository;
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

import java.time.LocalDateTime;
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
    private CarRepository carRepository; // Đã thêm mock này

    @Mock
    private BookingDelayedQueueService delayedQueueService;

    @InjectMocks
    private BookingServiceImpl bookingService;

    // ===== TEST 1: Chặn đặt xe khi chưa KYC =====
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

    // ===== TEST 2: Chặn hủy đơn khi đã COMPLETED =====
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

    // ===== TEST 3: Tự động hủy đơn quá 4h =====
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

    // ===== TEST 4: Chặn hủy đơn khi đã CANCELLED =====
    @Test
    @DisplayName("TC - Test chặn hủy đơn khi đơn đã CANCELLED")
    public void testCancelCancelledBooking() {
        Booking mockBooking = new Booking();
        mockBooking.setId(102L);
        mockBooking.setStatus(BookingStatus.CANCELLED);
        mockBooking.setCustomerId(3L);

        when(bookingRepository.findById(102L)).thenReturn(Optional.of(mockBooking));

        assertThrows(BadRequestException.class, () -> {
            bookingService.cancelBooking(102L, 3L, "Hủy lại lần 2");
        }, "Không được phép hủy đơn đã CANCELLED");
    }

    // ===== TEST 5: Chặn đặt xe khi ngày trả trước ngày nhận =====
    @Test
    @DisplayName("TC - Test chặn đặt xe khi ngày trả trước ngày nhận")
    public void testCreateBookingWithInvalidDates() {
        Long customerId = 3L;
        BookingRequest request = new BookingRequest();
        request.setRentalMode(RentalMode.SELF_DRIVE);
        request.setCarId(1L);
        
        // Ngày trả xe lại TRƯỚC ngày nhận xe
        request.setStartDate(LocalDateTime.now().plusDays(3));
        request.setEndDate(LocalDateTime.now().plusDays(1)); 

        User mockCustomer = new User();
        mockCustomer.setId(customerId);
        mockCustomer.setVerificationStatus(VerificationStatus.VERIFIED);

        // Giả lập một chiếc xe hợp lệ để code không bị lỗi NullPointerException
        Car mockCar = new Car();
        mockCar.setId(1L);
        mockCar.setStatus(CarStatus.AVAILABLE);
        mockCar.setOwnerId(2L); // Gán owner khác để không bị lỗi "tự thuê xe mình"

        when(userRepository.findById(customerId)).thenReturn(Optional.of(mockCustomer));
        when(carRepository.findById(1L)).thenReturn(Optional.of(mockCar));

        assertThrows(BadRequestException.class, () -> {
            bookingService.createBooking(customerId, request);
        }, "Ngày trả trước ngày nhận phải bị chặn");
    }
}