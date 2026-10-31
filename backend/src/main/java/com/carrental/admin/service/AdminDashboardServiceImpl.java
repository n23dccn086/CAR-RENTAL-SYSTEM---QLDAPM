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
    com.carrental.payment.repository.PaymentRepository paymentRepository;
    com.carrental.payment.repository.RefundRepository refundRepository;

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

        BigDecimal defaultDepositPercent = configHelper.getDefaultDepositPercent();
        Integer depositPercent = defaultDepositPercent != null ? defaultDepositPercent.intValue() : 30;

        // ===== 4. TIỀN CỌC & QUỸ TẠM GIỮ (ESCROW) =====
        // 1. Tiền cọc đang tạm giữ riêng: đơn PAID (chưa duyệt, chưa tính vào doanh thu)
        long holdingDepositAmount = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.PAID)
                .mapToLong(b -> b.getDepositAmount() != null ? b.getDepositAmount() : 0L)
                .sum();
        long holdingDepositCount = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.PAID)
                .count();

        // 2. Tiền cọc đã sáp nhập doanh thu: đơn APPROVED, RENTED, RETURNED, COMPLETED
        long mergedDepositAmount = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.APPROVED
                        || b.getStatus() == BookingStatus.RENTED
                        || b.getStatus() == BookingStatus.RETURNED
                        || b.getStatus() == BookingStatus.COMPLETED)
                .mapToLong(b -> b.getDepositAmount() != null ? b.getDepositAmount() : 0L)
                .sum();
        long mergedDepositCount = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.APPROVED
                        || b.getStatus() == BookingStatus.RENTED
                        || b.getStatus() == BookingStatus.RETURNED
                        || b.getStatus() == BookingStatus.COMPLETED)
                .count();

        // 3. Tiền cọc đã hoàn trả: đơn CANCELLED có cọc thực tế đã thanh toán/hoàn trả
        java.util.Set<Long> bookingIdsWithPaidDeposit = paymentRepository.findAll().stream()
                .filter(p -> (p.getPaymentType() == null || p.getPaymentType() == com.carrental.payment.entity.PaymentType.DEPOSIT)
                        && (p.getStatus() == com.carrental.payment.entity.PaymentStatus.SUCCESS
                                || p.getStatus() == com.carrental.payment.entity.PaymentStatus.REFUNDED))
                .map(com.carrental.payment.entity.Payment::getBookingId)
                .collect(java.util.stream.Collectors.toSet());

        java.util.Set<Long> bookingIdsWithRefund = refundRepository.findAll().stream()
                .map(com.carrental.payment.entity.Refund::getBookingId)
                .collect(java.util.stream.Collectors.toSet());

        long refundedDepositAmount = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CANCELLED
                        && (bookingIdsWithPaidDeposit.contains(b.getId()) || bookingIdsWithRefund.contains(b.getId())))
                .mapToLong(b -> b.getDepositAmount() != null ? b.getDepositAmount() : 0L)
                .sum();
        long refundedDepositCount = allBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CANCELLED
                        && b.getDepositAmount() != null && b.getDepositAmount() > 0
                        && (bookingIdsWithPaidDeposit.contains(b.getId()) || bookingIdsWithRefund.contains(b.getId())))
                .count();

        return DashboardStatsResponse.builder()
                .totalRevenue(totalRevenue)
                .platformRevenue(platformRevenue)
                .commissionRate(commissionRate)
                .depositPercent(depositPercent)
                .holdingDepositAmount(holdingDepositAmount)
                .holdingDepositCount(holdingDepositCount)
                .mergedDepositAmount(mergedDepositAmount)
                .mergedDepositCount(mergedDepositCount)
                .refundedDepositAmount(refundedDepositAmount)
                .refundedDepositCount(refundedDepositCount)
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

    @Override
    public com.carrental.admin.dto.AdminDepositSummaryResponse getDepositSummary() {
        log.info("Computing admin deposit escrow summary and breakdown");
        List<Booking> allBookings = bookingRepository.findAll();

        long holdingAmount = 0L;
        long holdingCount = 0L;
        long mergedAmount = 0L;
        long mergedCount = 0L;
        long refundedAmount = 0L;
        long refundedCount = 0L;

        List<com.carrental.admin.dto.AdminDepositSummaryResponse.DepositBookingItem> holdingList = new java.util.ArrayList<>();
        List<com.carrental.admin.dto.AdminDepositSummaryResponse.DepositBookingItem> mergedList = new java.util.ArrayList<>();
        List<com.carrental.admin.dto.AdminDepositSummaryResponse.DepositBookingItem> refundedList = new java.util.ArrayList<>();

        java.util.Map<Long, com.carrental.car.entity.Car> carMap = carRepository.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(com.carrental.car.entity.Car::getId, c -> c, (a, b) -> a));
        java.util.Map<Long, com.carrental.user.entity.User> userMap = userRepository.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(com.carrental.user.entity.User::getId, u -> u, (a, b) -> a));

        java.util.Set<Long> bookingIdsWithPaidDeposit = paymentRepository.findAll().stream()
                .filter(p -> (p.getPaymentType() == null || p.getPaymentType() == com.carrental.payment.entity.PaymentType.DEPOSIT)
                        && (p.getStatus() == com.carrental.payment.entity.PaymentStatus.SUCCESS
                                || p.getStatus() == com.carrental.payment.entity.PaymentStatus.REFUNDED))
                .map(com.carrental.payment.entity.Payment::getBookingId)
                .collect(java.util.stream.Collectors.toSet());

        java.util.Set<Long> bookingIdsWithRefund = refundRepository.findAll().stream()
                .map(com.carrental.payment.entity.Refund::getBookingId)
                .collect(java.util.stream.Collectors.toSet());

        for (Booking b : allBookings) {
            long dep = b.getDepositAmount() != null ? b.getDepositAmount() : 0L;
            boolean hasPaidDeposit = bookingIdsWithPaidDeposit.contains(b.getId()) || bookingIdsWithRefund.contains(b.getId());
            if (b.getStatus() == BookingStatus.PAID) {
                holdingAmount += dep;
                holdingCount++;
                holdingList.add(toDepositItem(b, carMap, userMap,
                        "Đang tạm giữ riêng tại Quỹ tạm giữ (Escrow). Sẽ hoàn trả cho khách nếu chủ xe không duyệt hoặc khách hủy đơn."));
            } else if (b.getStatus() == BookingStatus.APPROVED
                    || b.getStatus() == BookingStatus.RENTED
                    || b.getStatus() == BookingStatus.RETURNED
                    || b.getStatus() == BookingStatus.COMPLETED) {
                mergedAmount += dep;
                mergedCount++;
                mergedList.add(toDepositItem(b, carMap, userMap,
                        "Chủ xe đã duyệt đơn — Tiền cọc đã chính thức sáp nhập vào dòng tiền Doanh thu sàn."));
            } else if (b.getStatus() == BookingStatus.CANCELLED && dep > 0 && hasPaidDeposit) {
                refundedAmount += dep;
                refundedCount++;
                refundedList.add(toDepositItem(b, carMap, userMap,
                        "Đơn đã hủy — Tiền cọc đã được hoàn trả lại cho khách hàng."));
            }
        }

        java.util.Comparator<com.carrental.admin.dto.AdminDepositSummaryResponse.DepositBookingItem> comp =
                (a, b) -> (b.getCreatedAt() != null && a.getCreatedAt() != null)
                        ? b.getCreatedAt().compareTo(a.getCreatedAt()) : 0;
        holdingList.sort(comp);
        mergedList.sort(comp);
        refundedList.sort(comp);

        return com.carrental.admin.dto.AdminDepositSummaryResponse.builder()
                .holdingDepositAmount(holdingAmount)
                .holdingDepositCount(holdingCount)
                .mergedDepositAmount(mergedAmount)
                .mergedDepositCount(mergedCount)
                .refundedDepositAmount(refundedAmount)
                .refundedDepositCount(refundedCount)
                .holdingBookings(holdingList)
                .mergedBookings(mergedList)
                .refundedBookings(refundedList)
                .build();
    }

    private com.carrental.admin.dto.AdminDepositSummaryResponse.DepositBookingItem toDepositItem(
            Booking b,
            java.util.Map<Long, com.carrental.car.entity.Car> carMap,
            java.util.Map<Long, com.carrental.user.entity.User> userMap,
            String note) {
        com.carrental.car.entity.Car car = carMap.get(b.getCarId());
        com.carrental.user.entity.User customer = userMap.get(b.getCustomerId());
        com.carrental.user.entity.User owner = userMap.get(b.getOwnerId());

        String carName = car != null ? (car.getBrand() + " " + car.getModel()) : "Xe #" + b.getCarId();
        String carPlate = car != null ? car.getPlate() : "";
        String custName = customer != null ? customer.getName() : "Khách #" + b.getCustomerId();
        String custPhone = customer != null ? customer.getPhone() : "";
        String ownName = owner != null ? owner.getName() : "Chủ xe #" + b.getOwnerId();
        String ownPhone = owner != null ? owner.getPhone() : "";

        return com.carrental.admin.dto.AdminDepositSummaryResponse.DepositBookingItem.builder()
                .bookingId(b.getId())
                .carName(carName)
                .carPlate(carPlate)
                .customerName(custName)
                .customerPhone(custPhone)
                .ownerName(ownName)
                .ownerPhone(ownPhone)
                .depositAmount(b.getDepositAmount() != null ? b.getDepositAmount() : 0L)
                .totalPrice(b.getTotalPrice() != null ? b.getTotalPrice() : 0L)
                .status(b.getStatus().name())
                .statusDescription(b.getStatus().getDescription())
                .createdAt(b.getCreatedAt())
                .note(note)
                .build();
    }
}