package com.carrental.handover.service;

import com.carrental.admin.service.ConfigHelper;
import com.carrental.booking.entity.Booking;
import com.carrental.car.entity.Car;
import com.carrental.car.entity.RentalMode;
import com.carrental.handover.entity.HandoverRecord;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Gọi THẬT HandoverServiceImpl.calculateLateFee / calculateReturnKmOverage (private).
 * Hồi quy cho lỗi hóa đơn lệch biên bản:
 *  - phí trễ bị tính thiếu 7h do quy đổi UTC→VN sai (24h07p bị tính thành 17h07p);
 *  - đơn có tài xế không bị tính phí vượt km.
 */
@ExtendWith(MockitoExtension.class)
class HandoverLateFeeTest {

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

    private static final LocalDateTime END = LocalDateTime.of(2026, 11, 13, 10, 0); // thứ Sáu
    private Booking booking;

    @BeforeEach
    void setUp() {
        lenient().when(configHelper.getLateFeePerHour()).thenReturn(new BigDecimal("100000"));
        Car car = Car.builder().id(3L).pricePerDay(700_000L).priceWeekend(900_000L).build();
        lenient().when(carRepository.findById(3L)).thenReturn(Optional.of(car));

        booking = new Booking();
        booking.setId(18L);
        booking.setCarId(3L);
        booking.setStartDate(END.minusDays(1)); // nhận xe thứ Năm → giá thường
        booking.setEndDate(END);
    }

    private long lateFee(LocalDateTime actual) {
        Object r = ReflectionTestUtils.invokeMethod(service, "calculateLateFee", booking, actual);
        return ((BigDecimal) ReflectionTestUtils.invokeMethod(r, "fee")).longValue();
    }

    private int lateMinutes(LocalDateTime actual) {
        Object r = ReflectionTestUtils.invokeMethod(service, "calculateLateFee", booking, actual);
        return (int) ReflectionTestUtils.invokeMethod(r, "minutesLate");
    }

    @Test
    @DisplayName("LF1 - Trễ 24h07p: tính đúng 1447 phút và phạt 120% giá ngày (840.000đ), không bị lệch 7h")
    void over24hNoTimezoneShift() {
        LocalDateTime actual = END.plusHours(24).plusMinutes(7);
        assertEquals(24 * 60 + 7, lateMinutes(actual));
        assertEquals(840_000L, lateFee(actual));
    }

    @Test
    @DisplayName("LF2 - Các mốc: <15p miễn phí, <60p theo giờ, <4h nửa ngày, <24h một ngày")
    void thresholds() {
        assertEquals(0L, lateFee(END.plusMinutes(14)));
        assertEquals(100_000L, lateFee(END.plusMinutes(15)));
        assertEquals(350_000L, lateFee(END.plusMinutes(60)));
        assertEquals(700_000L, lateFee(END.plusMinutes(240)));
        assertEquals(700_000L, lateFee(END.plusMinutes(1439)));
        assertEquals(840_000L, lateFee(END.plusMinutes(1440)));
    }

    @Test
    @DisplayName("LF3 - Trả sớm / đúng giờ: phí 0")
    void onTime() {
        assertEquals(0L, lateFee(END));
        assertEquals(0L, lateFee(END.minusHours(3)));
    }

    @Test
    @DisplayName("LF4 - Nhận xe cuối tuần: dùng giá cuối tuần, khớp Car.dailyRateFor (giá frontend xem trước)")
    void weekendRate() {
        booking.setStartDate(LocalDateTime.of(2026, 11, 14, 9, 0)); // thứ Bảy
        assertEquals(900_000L, lateFee(END.plusHours(5)));
        Car car = carRepository.findById(3L).orElseThrow();
        assertEquals(900_000L, car.dailyRateFor(booking.getStartDate()));
        assertEquals(700_000L, car.dailyRateFor(END.minusDays(1)));
    }

    @Test
    @DisplayName("KM-D1 - Đơn CÓ TÀI XẾ vẫn bị tính phí vượt km theo ODO biên bản giao xe")
    void withDriverChargesKmOverage() {
        lenient().when(configHelper.getDefaultKmPerDay()).thenReturn(300);
        lenient().when(configHelper.getKmOverageBracket1Limit()).thenReturn(50);
        lenient().when(configHelper.getKmOverageBracket1Price()).thenReturn(new BigDecimal("5000"));
        lenient().when(configHelper.getKmOverageBracket2Limit()).thenReturn(100);
        lenient().when(configHelper.getKmOverageBracket2Price()).thenReturn(new BigDecimal("8000"));
        lenient().when(configHelper.getKmOverageBracket3Price()).thenReturn(new BigDecimal("12000"));
        lenient().when(configHelper.getMaxKmOveragePerDay()).thenReturn(500);
        lenient().when(configHelper.getMaxTotalKmOverage()).thenReturn(2000);
        booking.setRentalMode(RentalMode.WITH_DRIVER);
        HandoverRecord pickup = HandoverRecord.builder().bookingId(18L).handoverType("PICKUP").kmReading(10_000).build();
        when(handoverRepository.findByBookingIdAndHandoverType(18L, "PICKUP")).thenReturn(Optional.of(pickup));

        // 1 ngày → định mức 300 km; chạy 420 km → vượt 120 km → 50×5000 + 50×8000 + 20×12000
        Object r = ReflectionTestUtils.invokeMethod(service, "calculateReturnKmOverage", booking, 10_420);
        assertNotNull(r);
        assertEquals(120, (int) ReflectionTestUtils.invokeMethod(r, "kmOverage"));
        assertEquals(0, new BigDecimal("890000").compareTo((BigDecimal) ReflectionTestUtils.invokeMethod(r, "fee")));
    }

    @Test
    @DisplayName("KM-D2 - Chưa có biên bản giao xe → không tính phí vượt km (null)")
    void noPickupRecord() {
        when(handoverRepository.findByBookingIdAndHandoverType(18L, "PICKUP")).thenReturn(Optional.empty());
        assertNull(ReflectionTestUtils.invokeMethod(service, "calculateReturnKmOverage", booking, 10_420));
    }

    @Test
    @DisplayName("LF6 - Trễ nhiều ngày: mỗi 24h trọn vẹn = 120% đơn giá, phần lẻ theo bảng mốc")
    void multiDayLateFeeScales() {
        // 2 ngày trọn = 2 × 840.000
        assertEquals(1_680_000L, lateFee(END.plusDays(2)));
        // 2 ngày + 5h lẻ = 2 × 840.000 + 1 ngày (≥ 4h)
        assertEquals(1_680_000L + 700_000L, lateFee(END.plusDays(2).plusHours(5)));
        // 5 ngày + 30 phút lẻ = 5 × 840.000 + phí 1 giờ
        assertEquals(5 * 840_000L + 100_000L, lateFee(END.plusDays(5).plusMinutes(30)));
    }
}
