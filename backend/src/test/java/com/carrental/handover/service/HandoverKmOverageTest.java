package com.carrental.handover.service;

import com.carrental.admin.service.ConfigHelper;
import com.carrental.booking.entity.Booking;
import com.carrental.common.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.lenient;

/**
 * Gọi THẬT HandoverServiceImpl.calculateKmOverage (private) để kiểm tra phí vượt km theo 3 bậc.
 */
@ExtendWith(MockitoExtension.class)
class HandoverKmOverageTest {

    @Mock com.carrental.handover.repository.HandoverRecordRepository handoverRepository;
    @Mock com.carrental.handover.repository.HandoverImageRepository imageRepository;
    @Mock com.carrental.booking.repository.BookingRepository bookingRepository;
    @Mock com.carrental.car.repository.CarRepository carRepository;
    @Mock com.carrental.user.repository.UserRepository userRepository;
    @Mock com.carrental.handover.dto.HandoverMapper handoverMapper;
    @Mock com.carrental.notification.service.NotificationService notificationService;
    @Mock ConfigHelper configHelper;
    @Mock com.carrental.common.service.FileStorageService fileStorageService;

    @InjectMocks HandoverServiceImpl service;

    private Booking twoDayBooking;

    @BeforeEach
    void setUp() {
        lenient().when(configHelper.getDefaultKmPerDay()).thenReturn(300);
        lenient().when(configHelper.getKmOverageBracket1Limit()).thenReturn(50);
        lenient().when(configHelper.getKmOverageBracket1Price()).thenReturn(new BigDecimal("5000"));
        lenient().when(configHelper.getKmOverageBracket2Limit()).thenReturn(100);
        lenient().when(configHelper.getKmOverageBracket2Price()).thenReturn(new BigDecimal("8000"));
        lenient().when(configHelper.getKmOverageBracket3Price()).thenReturn(new BigDecimal("12000"));
        lenient().when(configHelper.getMaxKmOveragePerDay()).thenReturn(500);
        lenient().when(configHelper.getMaxTotalKmOverage()).thenReturn(2000);

        LocalDateTime start = LocalDateTime.of(2026, 11, 10, 8, 0);
        twoDayBooking = new Booking();
        twoDayBooking.setId(1L);
        twoDayBooking.setStartDate(start);
        twoDayBooking.setEndDate(start.plusHours(48)); // 2 ngày → định mức 600 km
    }

    private Object calc(int pickupKm, int returnKm) {
        return ReflectionTestUtils.invokeMethod(service, "calculateKmOverage", twoDayBooking, pickupKm, returnKm);
    }

    private static Object field(Object result, String name) {
        return ReflectionTestUtils.invokeMethod(result, name);
    }

    @Test
    @DisplayName("KM1 - Không vượt định mức: phí 0, vẫn trả đúng km được phép")
    void withinAllowance() {
        Object r = calc(10_000, 10_000); // chạy 0 km
        assertEquals(0, field(r, "kmDriven"));
        assertEquals(600, field(r, "kmAllowed"), "kmAllowed phải = 300 × 2 ngày kể cả khi chạy 0 km");
        assertEquals(0, field(r, "kmOverage"));
        assertEquals(0, BigDecimal.ZERO.compareTo((BigDecimal) field(r, "fee")));

        Object r2 = calc(10_000, 10_600); // đúng bằng định mức
        assertEquals(0, field(r2, "kmOverage"));
        assertEquals(0, BigDecimal.ZERO.compareTo((BigDecimal) field(r2, "fee")));
    }

    @Test
    @DisplayName("KM2 - Vượt trong bậc 1: 30 km × 5.000 = 150.000")
    void bracket1() {
        Object r = calc(10_000, 10_630);
        assertEquals(30, field(r, "kmOverage"));
        assertEquals(0, new BigDecimal("150000").compareTo((BigDecimal) field(r, "fee")));
    }

    @Test
    @DisplayName("KM3 - Vượt qua bậc 2: 50×5.000 + 30×8.000 = 490.000")
    void bracket2() {
        Object r = calc(10_000, 10_680);
        assertEquals(80, field(r, "kmOverage"));
        assertEquals(0, new BigDecimal("490000").compareTo((BigDecimal) field(r, "fee")));
    }

    @Test
    @DisplayName("KM4 - Vượt qua bậc 3: 50×5.000 + 50×8.000 + 20×12.000 = 890.000")
    void bracket3() {
        Object r = calc(10_000, 10_720);
        assertEquals(720, field(r, "kmDriven"));
        assertEquals(120, field(r, "kmOverage"));
        assertEquals(0, new BigDecimal("890000").compareTo((BigDecimal) field(r, "fee")));
    }

    @Test
    @DisplayName("KM5 - ODO trả nhỏ hơn ODO nhận → từ chối")
    void returnKmLessThanPickup() {
        assertThrows(BadRequestException.class, () -> calc(10_000, 9_999));
    }

    @Test
    @DisplayName("KM6 - Vượt trần cho phép (min(2000, 500×2) = 1000 km) → từ chối; đúng trần thì vẫn tính phí")
    void overCap() {
        assertThrows(BadRequestException.class, () -> calc(10_000, 10_000 + 600 + 1001));
        Object r = calc(10_000, 10_000 + 600 + 1000);
        assertEquals(1000, field(r, "kmOverage"));
        // 50×5.000 + 50×8.000 + 900×12.000 = 11.450.000
        assertEquals(0, new BigDecimal("11450000").compareTo((BigDecimal) field(r, "fee")));
    }
}
