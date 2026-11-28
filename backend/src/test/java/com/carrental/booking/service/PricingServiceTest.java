package com.carrental.booking.service;

import com.carrental.admin.service.ConfigHelper;
import com.carrental.booking.entity.BookingDetail;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class PricingServiceTest {

    @Mock
    private ConfigHelper configHelper; // Giả lập ConfigHelper

    @InjectMocks
    private PricingService pricingService; // Tiêm class cần test

    @Test
    @DisplayName("Test tính tiền cọc 30% (Gọi hàm thực tế calculateDeposit)")
    public void testCalculateDeposit() {
        // 1. Giả lập (Mock) config trả về 30%
        when(configHelper.getDefaultDepositPercent()).thenReturn(new BigDecimal("30"));

        long totalPrice = 1000000; // 1 triệu
        long expectedDeposit = 300000; // 30% của 1 triệu

        // 2. Gọi hàm thực tế trong code của bạn Khoan
        long actualDeposit = pricingService.calculateDeposit(totalPrice);

        // 3. Kiểm tra
        assertEquals(expectedDeposit, actualDeposit, "Tiền cọc 30% phải là 300.000đ");
    }

    @Test
    @DisplayName("Test tính tổng tiền (Gọi hàm thực tế calculateTotal)")
    public void testCalculateTotal() {
        // 1. Tạo dữ liệu BookingDetail
        BookingDetail detail = BookingDetail.builder()
                .rentalFee(1000000L) // Tiền thuê xe
                .deliveryFee(100000L) // Phí giao xe
                .insuranceFee(200000L) // Phí bảo hiểm
                .driverFee(0L) // Không có tài xế
                .discount(0L) // Không giảm giá
                .extraFee(0L) // Không phụ phí
                .build();

        long expectedTotal = 1300000; // Tổng = 1tr + 100k + 200k

        // 2. Gọi hàm thực tế
        long actualTotal = pricingService.calculateTotal(detail);

        // 3. Kiểm tra
        assertEquals(expectedTotal, actualTotal, "Tổng tiền phải là 1.300.000đ");
    }

    @Test
    @DisplayName("Giá cuối tuần tính theo TỪNG ngày, không lấy giá ngày nhận xe nhân cho cả đơn")
    public void testRentalFeePerDayWeekendPricing() {
        com.carrental.car.entity.Car car = com.carrental.car.entity.Car.builder()
                .pricePerDay(700_000L).priceWeekend(900_000L).build();

        // T6 13/11/2026 10:00 → T2 16/11 10:00 = 3 ngày: T6 (thường) + T7 + CN (cuối tuần)
        java.time.LocalDateTime friday = java.time.LocalDateTime.of(2026, 11, 13, 10, 0);
        assertEquals(700_000L + 900_000L + 900_000L, pricingService.calculateRentalFee(car, friday, 3));

        // T7 14/11 → T4 18/11 = 4 ngày: T7 + CN (cuối tuần) + T2 + T3 (thường)
        java.time.LocalDateTime saturday = java.time.LocalDateTime.of(2026, 11, 14, 10, 0);
        assertEquals(2 * 900_000L + 2 * 700_000L, pricingService.calculateRentalFee(car, saturday, 4));
    }

    @Test
    @DisplayName("Xe không cấu hình giá cuối tuần thì mọi ngày dùng giá thường")
    public void testRentalFeeWithoutWeekendPrice() {
        com.carrental.car.entity.Car car = com.carrental.car.entity.Car.builder().pricePerDay(500_000L).build();
        java.time.LocalDateTime saturday = java.time.LocalDateTime.of(2026, 11, 14, 10, 0);
        assertEquals(1_500_000L, pricingService.calculateRentalFee(car, saturday, 3));
    }
}
