package com.carrental.booking.service;

import com.carrental.admin.service.ConfigHelper;
import com.carrental.booking.dto.BookingMapper;
import com.carrental.booking.dto.BookingRequest;
import com.carrental.booking.dto.BookingResponse;
import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingDetail;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingDetailRepository;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.car.entity.Car;
import com.carrental.car.entity.CarStatus;
import com.carrental.car.entity.RentalMode;
import com.carrental.car.repository.CarRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.driver.entity.Driver;
import com.carrental.driver.entity.DriverStatus;
import com.carrental.driver.repository.DriverRepository;
import com.carrental.driver.service.DriverAssignmentService;
import com.carrental.handover.repository.HandoverRecordRepository;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import com.carrental.payment.entity.Payment;
import com.carrental.payment.entity.PaymentStatus;
import com.carrental.payment.entity.Refund;
import com.carrental.payment.repository.PaymentRepository;
import com.carrental.payment.repository.RefundRepository;
import com.carrental.user.entity.User;
import com.carrental.user.entity.VerificationStatus;
import com.carrental.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BookingServiceImpl implements BookingService {

    BookingRepository bookingRepository;
    BookingDetailRepository bookingDetailRepository;
    CarRepository carRepository;
    UserRepository userRepository;
    DriverRepository driverRepository;
    BookingMapper bookingMapper;
    PricingService pricingService;
    PaymentRepository paymentRepository;
    RefundRepository refundRepository;
    NotificationService notificationService;
    HandoverRecordRepository handoverRepository;
    ConfigHelper configHelper;
    DriverAssignmentService driverAssignmentService;

    // ===== CREATE =====

    @Override
    @Transactional
    public BookingResponse createBooking(Long customerId, BookingRequest request) {
        log.info("Create booking: customerId={}, carId={}", customerId, request.getCarId());

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        if (request.getRentalMode() == RentalMode.SELF_DRIVE
                && customer.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Bạn cần xác thực GPLX/CCCD trước khi thuê xe tự lái.");
        }

        Car car = carRepository.findById(request.getCarId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.CAR_NOT_FOUND));

        if (car.getStatus() != CarStatus.AVAILABLE) {
            throw new BadRequestException(ErrorCode.CAR_NOT_AVAILABLE);
        }

        if (!request.getEndDate().isAfter(request.getStartDate())) {
            throw new BadRequestException(ErrorCode.INVALID_BOOKING_DATES);
        }

        boolean exists = bookingRepository.existsActiveBooking(
                request.getCarId(), request.getStartDate(), request.getEndDate());
        if (exists) {
            throw new BadRequestException(ErrorCode.BOOKING_ALREADY_EXISTS);
        }

        Long driverId = request.getDriverId();
        if (request.getRentalMode() == RentalMode.WITH_DRIVER) {
            if (driverId == null) {
                throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                        "Vui lòng chọn tài xế cho đơn thuê có tài xế.");
            }

            Driver driver = driverRepository.findById(driverId)
                    .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DRIVER_NOT_FOUND));

            if (!driver.getOwnerId().equals(car.getOwnerId())) {
                throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                        "Tài xế được chọn không thuộc chủ xe của cỗ xe này.");
            }

            if (driver.getStatus() != DriverStatus.ACTIVE) {
                throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                        "Tài xế được chọn hiện không hoạt động.");
            }
        } else {
            driverId = null;
        }

        BookingDetail detail = pricingService.calculatePricing(car, request);
        long totalPrice = pricingService.calculateTotal(detail);
        long depositAmount = pricingService.calculateDeposit(totalPrice);
        long remainingAmount = totalPrice - depositAmount;

        Booking booking = Booking.builder()
                .customerId(customerId)
                .carId(car.getId())
                .ownerId(car.getOwnerId())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .pickupAddress(request.getPickupAddress())
                .returnAddress(request.getReturnAddress())
                .rentalMode(request.getRentalMode())
                .driverId(driverId)
                .totalPrice(totalPrice)
                .depositAmount(depositAmount)
                .remainingAmount(remainingAmount)
                .status(BookingStatus.PENDING)
                .customerNote(request.getCustomerNote())
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        detail.setBookingId(savedBooking.getId());
        BookingDetail savedDetail = bookingDetailRepository.save(detail);

        log.info("Booking created: id={}, total={}, driverId={}",
                savedBooking.getId(), totalPrice, driverId);

        return buildResponse(savedBooking, savedDetail);
    }

    // ===== READ =====

    @Override
    public BookingResponse getBookingById(Long id) {
        Booking booking = getBookingEntityById(id);
        BookingDetail detail = bookingDetailRepository.findByBookingId(id).orElse(null);
        return buildResponse(booking, detail);
    }

    @Override
    public Booking getBookingEntityById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));
    }

    @Override
    public List<BookingResponse> getMyBookings(Long customerId) {
        List<Booking> bookings = bookingRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        return bookings.stream().map(b -> buildResponse(b, null)).toList();
    }

    @Override
    public List<BookingResponse> getOwnerBookings(Long ownerId) {
        List<Booking> bookings = bookingRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
        return bookings.stream().map(b -> buildResponse(b, null)).toList();
    }

    @Override
    public List<BookingResponse> getBookingsByStatus(BookingStatus status) {
        List<Booking> bookings = bookingRepository.findByStatus(status);
        return bookings.stream().map(b -> buildResponse(b, null)).toList();
    }

    // ===== ACTIONS =====

    @Override
    @Transactional
    public BookingResponse cancelBooking(Long id, Long customerId, String reason) {
        log.info("Cancel booking: id={}, customerId={}, reason={}", id, customerId, reason);

        Booking booking = getBookingEntityById(id);

        if (!booking.getCustomerId().equals(customerId)) {
            throw new UnauthorizedException(ErrorCode.UNAUTHORIZED);
        }

        if (booking.getStatus() != BookingStatus.PENDING
                && booking.getStatus() != BookingStatus.PAID
                && booking.getStatus() != BookingStatus.APPROVED) {
            throw new BadRequestException(ErrorCode.BOOKING_CANNOT_CANCEL,
                    "Chỉ có thể hủy đơn khi đơn ở trạng thái Chưa cọc / Đã cọc / Đã duyệt. "
                            + "Đơn đã nhận xe không thể hủy.");
        }

        long refundAmount = calculateRefundAmount(booking);
        long depositPaid = booking.getDepositAmount();

        log.info("Refund calculation: deposit={}, refund={}", depositPaid, refundAmount);

        if (refundAmount > 0) {
            Payment payment = paymentRepository
                    .findByBookingIdAndStatus(id, PaymentStatus.SUCCESS)
                    .orElse(null);

            if (payment != null) {
                Refund refund = Refund.builder()
                        .paymentId(payment.getId())
                        .bookingId(id)
                        .amount(refundAmount)
                        .reason("Khách hủy đơn: " + (reason != null ? reason : "Không có lý do"))
                        .status(PaymentStatus.PENDING)
                        .build();
                refundRepository.save(refund);
                log.info("Refund created: amount={} for booking {}", refundAmount, id);
            }
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelReason(reason);
        booking.setCancelledAt(LocalDateTime.now());
        Booking updated = bookingRepository.save(booking);

        // ★ Thông báo cho Owner
        try {
            notificationService.createNotification(
                    booking.getOwnerId(),
                    NotificationType.BOOKING_CANCELLED,
                    "Đơn bị hủy",
                    String.format("Đơn #%d đã bị khách hủy. Hoàn cọc: %dđ. Lý do: %s",
                            id, refundAmount, reason),
                    id);
        } catch (Exception e) {
            log.warn("Failed to notify owner: {}", e.getMessage());
        }

        // ★ Thông báo cho tất cả Admin (cần duyệt hoàn tiền)
        try {
            java.util.List<User> admins = userRepository.findByRole(com.carrental.user.entity.Role.ADMIN);
            for (User admin : admins) {
                notificationService.createNotification(
                        admin.getId(),
                        NotificationType.REFUND_REQUESTED,
                        "Yêu cầu hoàn tiền mới",
                        String.format("Đơn #%d bị khách hủy. Cần hoàn %dđ cho khách. Vui lòng duyệt.",
                                id, refundAmount),
                        id);
            }
        } catch (Exception e) {
            log.warn("Failed to notify admins: {}", e.getMessage());
        }

        log.info("Booking cancelled: id={}, refundAmount={}", id, refundAmount);
        return buildResponse(updated, null);
    }

    @Override
    @Transactional
    public BookingResponse approveBooking(Long id, Long ownerId, String note) {
        log.info("Approve booking: id={}, ownerId={}", id, ownerId);

        Booking booking = getBookingEntityById(id);

        if (!booking.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.UNAUTHORIZED);
        }

        if (booking.getStatus() != BookingStatus.PAID) {
            throw new BadRequestException(ErrorCode.BOOKING_STATUS_INVALID);
        }

        booking.setStatus(BookingStatus.APPROVED);
        if (note != null)
            booking.setOwnerNote(note);

        Booking updated = bookingRepository.save(booking);

        // ★ Thông báo cho Customer
        try {
            notificationService.createNotification(
                    booking.getCustomerId(),
                    NotificationType.BOOKING_APPROVED,
                    "Đơn đã được duyệt",
                    String.format("Đơn #%d đã được chủ xe duyệt. Vui lòng chờ nhận xe.", id),
                    id);
        } catch (Exception e) {
            log.warn("Failed to notify customer: {}", e.getMessage());
        }

        if (updated.getDriverId() != null) {
            try {
                driverAssignmentService.assignSelectedDriver(updated);
                log.info("Driver assignment created for booking {} with driver {}",
                        updated.getId(), updated.getDriverId());
            } catch (Exception e) {
                log.warn("Failed to create driver assignment: {}", e.getMessage());
            }
        }

        log.info("Booking approved: id={}", id);
        return buildResponse(updated, null);
    }

    @Override
    @Transactional
    public BookingResponse rejectBooking(Long id, Long ownerId, String reason) {
        log.info("Reject booking: id={}, ownerId={}", id, ownerId);

        Booking booking = getBookingEntityById(id);

        if (!booking.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.UNAUTHORIZED);
        }

        if (booking.getStatus() != BookingStatus.PENDING
                && booking.getStatus() != BookingStatus.PAID
                && booking.getStatus() != BookingStatus.APPROVED) {
            throw new BadRequestException(ErrorCode.BOOKING_CANNOT_CANCEL,
                    "Chủ xe chỉ có thể hủy đơn khi đơn ở trạng thái Chưa cọc / Đã cọc / Đã duyệt.");
        }

        long refundAmount = 0;

        if (booking.getStatus() == BookingStatus.PAID
                || booking.getStatus() == BookingStatus.APPROVED) {
            refundAmount = booking.getDepositAmount();

            Payment payment = paymentRepository
                    .findByBookingIdAndStatus(id, PaymentStatus.SUCCESS)
                    .orElse(null);

            if (payment != null && refundAmount > 0) {
                Refund refund = Refund.builder()
                        .paymentId(payment.getId())
                        .bookingId(id)
                        .amount(refundAmount)
                        .reason("Chủ xe hủy đơn. Lý do: " + reason)
                        .status(PaymentStatus.PENDING)
                        .build();
                refundRepository.save(refund);
                log.info("Refund created for owner cancel: amount={}", refundAmount);
            }
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelReason("Chủ xe hủy: " + reason);
        booking.setCancelledAt(LocalDateTime.now());

        Booking updated = bookingRepository.save(booking);

        // ★ Thông báo cho Customer
        try {
            notificationService.createNotification(
                    booking.getCustomerId(),
                    NotificationType.BOOKING_REJECTED,
                    "Chủ xe đã hủy đơn của bạn",
                    String.format(
                            "Đơn #%d đã bị chủ xe hủy. Bạn sẽ được HOÀN 100%% cọc (%dđ). "
                                    + "Lý do từ chủ xe: %s. Chúng tôi xin lỗi vì sự bất tiện này.",
                            id, refundAmount, reason),
                    id);
        } catch (Exception e) {
            log.warn("Failed to notify customer: {}", e.getMessage());
        }

        // ★ Thông báo cho tất cả Admin
        try {
            java.util.List<User> admins = userRepository.findByRole(com.carrental.user.entity.Role.ADMIN);
            for (User admin : admins) {
                notificationService.createNotification(
                        admin.getId(),
                        NotificationType.REFUND_REQUESTED,
                        "Yêu cầu hoàn tiền mới",
                        String.format("Đơn #%d bị chủ xe hủy. Cần hoàn %dđ cho khách. Vui lòng duyệt.",
                                id, refundAmount),
                        id);
            }
        } catch (Exception e) {
            log.warn("Failed to notify admins: {}", e.getMessage());
        }

        return buildResponse(updated, null);
    }

    @Override
    @Transactional
    public BookingResponse markAsPaid(Long id) {
        log.info("Mark as paid: id={}", id);

        Booking booking = getBookingEntityById(id);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException(ErrorCode.BOOKING_STATUS_INVALID);
        }

        booking.setStatus(BookingStatus.PAID);
        Booking updated = bookingRepository.save(booking);

        log.info("Booking paid: id={}", id);
        return buildResponse(updated, null);
    }

    @Override
    @Transactional
    public BookingResponse startRental(Long id, Long ownerId) {
        log.info("Start rental: id={}, ownerId={}", id, ownerId);

        Booking booking = getBookingEntityById(id);

        if (!booking.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.UNAUTHORIZED);
        }

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new BadRequestException(ErrorCode.BOOKING_STATUS_INVALID);
        }

        booking.setStatus(BookingStatus.RENTED);
        Booking updated = bookingRepository.save(booking);

        log.info("Rental started: id={}", id);
        return buildResponse(updated, null);
    }

    @Override
    @Transactional
    public BookingResponse completeRental(Long id, Long ownerId) {
        log.info("Complete rental: id={}, ownerId={}", id, ownerId);

        Booking booking = getBookingEntityById(id);

        if (!booking.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.UNAUTHORIZED);
        }

        if (booking.getStatus() != BookingStatus.RENTED) {
            throw new BadRequestException(ErrorCode.BOOKING_STATUS_INVALID);
        }

        booking.setStatus(BookingStatus.COMPLETED);
        booking.setActualReturnDate(LocalDateTime.now());

        Booking updated = bookingRepository.save(booking);

        Car car = carRepository.findById(booking.getCarId()).orElse(null);
        if (car != null) {
            car.setStatus(CarStatus.AVAILABLE);
            carRepository.save(car);
        }

        // ★ Thông báo cho Customer
        try {
            notificationService.createNotification(
                    booking.getCustomerId(),
                    NotificationType.BOOKING_COMPLETED,
                    "Đơn đã hoàn tất",
                    String.format("Đơn #%d đã hoàn tất. Mời bạn đánh giá chuyến đi.", id),
                    id);
        } catch (Exception e) {
            log.warn("Failed to notify customer: {}", e.getMessage());
        }

        log.info("Rental completed: id={}", id);
        return buildResponse(updated, null);
    }

    // ===== HELPER =====

    private long calculateRefundAmount(Booking booking) {
        if (booking.getStatus() == BookingStatus.PENDING) {
            return 0;
        }

        long deposit = booking.getDepositAmount();
        if (deposit <= 0)
            return 0;

        long hoursUntilStart = Duration.between(
                LocalDateTime.now(),
                booking.getStartDate()).toHours();

        BigDecimal percent;
        if (hoursUntilStart >= 24) {
            percent = configHelper.getRefundBefore24hPercent();
        } else if (hoursUntilStart >= 4) {
            percent = configHelper.getRefund4To24hPercent();
        } else if (hoursUntilStart > 0) {
            percent = configHelper.getRefundBefore4hPercent();
        } else {
            percent = configHelper.getRefundAfterPickupPercent();
        }

        return BigDecimal.valueOf(deposit)
                .multiply(percent)
                .divide(new BigDecimal("100"), 0, RoundingMode.DOWN)
                .longValue();
    }

    private BookingResponse buildResponse(Booking booking, BookingDetail detail) {
        BookingResponse response = bookingMapper.toResponse(booking);

        Car car = carRepository.findById(booking.getCarId()).orElse(null);
        if (car != null) {
            response.setCarName(car.getBrand() + " " + car.getModel());
            response.setCarPlate(car.getPlate());
        }

        User customer = userRepository.findById(booking.getCustomerId()).orElse(null);
        if (customer != null)
            response.setCustomerName(customer.getName());

        User owner = userRepository.findById(booking.getOwnerId()).orElse(null);
        if (owner != null)
            response.setOwnerName(owner.getName());

        if (detail != null) {
            response.setDetails(bookingMapper.toDetailResponse(detail));
        }

        try {
            response.setDepositPercent(
                    configHelper.getDefaultDepositPercent().intValue());
        } catch (Exception e) {
            log.warn("Failed to load depositPercent: {}", e.getMessage());
            response.setDepositPercent(30);
        }

        try {
            handoverRepository.findReturnHandoverByBookingId(booking.getId())
                    .ifPresent(handover -> {
                        BigDecimal lateFee = handover.getLateFee();
                        BigDecimal extraFees = handover.getExtraFees();
                        BigDecimal kmOverageFee = handover.getKmOverageFee();

                        long lateFeeVal = lateFee != null ? lateFee.longValue() : 0L;
                        long extraFeeVal = extraFees != null ? extraFees.longValue() : 0L;
                        long kmOverageFeeVal = kmOverageFee != null ? kmOverageFee.longValue() : 0L;

                        response.setLateFee(lateFeeVal);
                        response.setKmOverageFee(kmOverageFeeVal);
                        response.setExtraFees(extraFeeVal);
                        response.setTotalExtraFees(lateFeeVal + extraFees.longValue() + kmOverageFeeVal);
                        response.setLateMinutes(handover.getLateMinutes());
                        response.setExtraFeesNote(handover.getExtraFeesNote());

                        response.setKmDriven(handover.getKmDriven());
                        response.setKmAllowed(handover.getKmAllowed());
                        response.setKmOverage(handover.getKmOverage());
                    });
        } catch (Exception e) {
            log.warn("Failed to load handover fees for booking {}: {}",
                    booking.getId(), e.getMessage());
        }

        return response;
    }
}