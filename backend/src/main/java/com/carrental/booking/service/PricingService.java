package com.carrental.booking.service;

import com.carrental.admin.service.ConfigHelper;
import com.carrental.booking.dto.BookingRequest;
import com.carrental.booking.entity.BookingDetail;
import com.carrental.car.entity.Car;
import com.carrental.car.entity.RentalMode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PricingService {

    ConfigHelper configHelper;      // ← THÊM: inject helper đọc config

    // Giá bảo hiểm mỗi ngày (VND) — vẫn hardcode, chưa có config
    private static final long INSURANCE_FEE_PER_DAY = 100_000L;

    // Phí tài xế mỗi ngày (VND) — vẫn hardcode
    private static final long DRIVER_FEE_PER_DAY = 500_000L;

    // Số ngày tối thiểu
    private static final int MIN_RENTAL_DAYS = 1;

    /**
     * Tính toán chi tiết phí thuê xe
     */
    public BookingDetail calculatePricing(Car car, BookingRequest request) {
        log.info("Calculating pricing for car: {}, from {} to {}",
                car.getId(), request.getStartDate(), request.getEndDate());

        int rentalDays = calculateRentalDays(request.getStartDate(), request.getEndDate());

        long pricePerDay = getPricePerDay(car, request.getStartDate());
        long rentalFee = pricePerDay * rentalDays;

        long deliveryFee = Boolean.TRUE.equals(request.getDeliveryRequired())
                ? (car.getDeliveryFee() != null ? car.getDeliveryFee() : 0L)
                : 0L;

        long insuranceFee = Boolean.TRUE.equals(request.getHasInsurance())
                ? INSURANCE_FEE_PER_DAY * rentalDays
                : 0L;

        long driverFee = 0L;
        if (request.getRentalMode() == RentalMode.WITH_DRIVER
                || request.getRentalMode() == RentalMode.BOTH) {
            if (Boolean.TRUE.equals(request.getHasDriver())) {
                driverFee = DRIVER_FEE_PER_DAY * rentalDays;
            }
        }

        long discount = 0L;
        long extraFee = 0L;

        log.info("Pricing calculated: {} days, rentalFee: {}, total: {}",
                rentalDays, rentalFee,
                rentalFee + deliveryFee + insuranceFee + driverFee - discount + extraFee);

        return BookingDetail.builder()
                .rentalDays(rentalDays)
                .pricePerDay(pricePerDay)
                .rentalFee(rentalFee)
                .deliveryFee(deliveryFee)
                .insuranceFee(insuranceFee)
                .driverFee(driverFee)
                .discount(discount)
                .extraFee(extraFee)
                .build();
    }

    /**
     * Tính tổng tiền từ BookingDetail
     */
    public long calculateTotal(BookingDetail detail) {
        return detail.getRentalFee()
                + detail.getDeliveryFee()
                + detail.getInsuranceFee()
                + detail.getDriverFee()
                - detail.getDiscount()
                + detail.getExtraFee();
    }

    /**
     * Tính tiền cọc — ĐỌC % TỪ CONFIG (default_deposit_percent).
     * VD: config=30 → cọc = totalPrice × 30%
     */
    public long calculateDeposit(long totalPrice) {
        BigDecimal depositPercent = configHelper.getDefaultDepositPercent();

        BigDecimal deposit = BigDecimal.valueOf(totalPrice)
                .multiply(depositPercent)
                .divide(new BigDecimal("100"), 0, RoundingMode.HALF_UP);

        log.info("Deposit calculated: total={}, percent={}%, deposit={}",
                totalPrice, depositPercent, deposit);

        return deposit.longValue();
    }

    /**
     * Tính số ngày thuê (làm tròn lên)
     */
    private int calculateRentalDays(LocalDateTime start, LocalDateTime end) {
        Duration duration = Duration.between(start, end);
        long hours = duration.toHours();

        if (hours <= 24) {
            return MIN_RENTAL_DAYS;
        }

        int days = (int) Math.ceil(hours / 24.0);
        return Math.max(days, MIN_RENTAL_DAYS);
    }

    /**
     * Lấy giá thuê theo ngày (xử lý giá cuối tuần, lễ)
     */
    private long getPricePerDay(Car car, LocalDateTime startDate) {
        int dayOfWeek = startDate.getDayOfWeek().getValue();
        boolean isWeekend = dayOfWeek == 6 || dayOfWeek == 7;

        if (isWeekend && car.getPriceWeekend() != null && car.getPriceWeekend() > 0) {
            return car.getPriceWeekend();
        }

        return car.getPricePerDay();
    }
}