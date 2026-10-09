package com.carrental.admin.service;

import com.carrental.admin.dto.DashboardStatsResponse;
import com.carrental.admin.repository.DisputeRepository;
import com.carrental.admin.repository.OwnerRequestRepository;
import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.car.entity.CarStatus;
import com.carrental.car.repository.CarRepository;
import com.carrental.driver.entity.DriverStatus;
import com.carrental.driver.repository.DriverRepository;
import com.carrental.review.repository.ReviewRepository;
import com.carrental.user.entity.VerificationStatus;
import com.carrental.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AdminDashboardServiceImpl implements AdminDashboardService {

    BookingRepository bookingRepository;
    CarRepository carRepository;
    DriverRepository driverRepository;
    ReviewRepository reviewRepository;
    UserRepository userRepository;
    OwnerRequestRepository ownerRequestRepository;
    DisputeRepository disputeRepository;
    ConfigHelper configHelper;

    @Override
    public DashboardStatsResponse getStats() {
        log.info("Computing admin dashboard stats");

        // ===== 1. BOOKING STATS =====
        List<Booking> allBookings = bookingRepository.findAll();

        long totalBookings = allBookings.size();
        long completedCount = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .count();
        long cancelledCount = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CANCELLED)
                .count();

        // Doanh thu sàn = TỔNG totalPrice của đơn COMPLETED (chưa trích hoa hồng)
        long totalRevenue = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .mapToLong(b -> b.getTotalPrice() != null ? b.getTotalPrice() : 0L)
                .sum();

        // % hoa hồng từ config
        BigDecimal commissionRate = configHelper.getCommissionRate();

        // Số nền tảng thực nhận = commission_rate% × totalRevenue
        long platformRevenue = BigDecimal.valueOf(totalRevenue)
                .multiply(commissionRate)
                .divide(new BigDecimal("100"), 0, RoundingMode.DOWN)
                .longValue();

        // Tỉ lệ hủy = cancelled / total × 100
        double cancelRate = totalBookings > 0
                ? Math.round((cancelledCount * 100.0 / totalBookings) * 10.0) / 10.0
                : 0.0;

        // ===== 2. CSAT =====
        Double avgCarRating = reviewRepository.getAverageCarRatingAll();
        Double avgOwnerRating = reviewRepository.getAverageOwnerRatingAll();
        long totalReviews = reviewRepository.count();

        double csatCar = avgCarRating != null
                ? Math.round(avgCarRating * 10.0) / 10.0
                : 0.0;
        double csatOwner = avgOwnerRating != null
                ? Math.round(avgOwnerRating * 10.0) / 10.0
                : 0.0;

        // CSAT_tổng = (CSAT_xe + CSAT_chủ_xe) / 2
        double csat = Math.round(((csatCar + csatOwner) / 2.0) * 10.0) / 10.0;

        // ===== 3. PENDING APPROVALS =====
        long pendingCars = carRepository.findByStatus(CarStatus.PENDING).size();

        // ★ Đếm tài xế chờ duyệt
        long pendingDrivers = driverRepository.countByStatusAndDeletedAtIsNull(DriverStatus.PENDING);

        long pendingVerifications = userRepository
                .findByVerificationStatus(VerificationStatus.PENDING).size();

        long pendingOwnerRequests = ownerRequestRepository.countByStatusAndDeletedAtIsNull("PENDING");
        long pendingDisputes = disputeRepository.countByStatus("PENDING");

        return DashboardStatsResponse.builder()
                .totalRevenue(totalRevenue)
                .platformRevenue(platformRevenue)
                .commissionRate(commissionRate)
                .totalBookings(totalBookings)
                .completedBookings(completedCount)
                .cancelledBookings(cancelledCount)
                .cancelRate(cancelRate)
                .csatCar(csatCar)
                .csatOwner(csatOwner)
                .csat(csat)
                .totalReviews(totalReviews)
                .pendingCars(pendingCars)
                .pendingDrivers(pendingDrivers)
                .pendingVerifications(pendingVerifications)
                .pendingOwnerRequests(pendingOwnerRequests)
                .pendingDisputes(pendingDisputes)
                .build();
    }
}