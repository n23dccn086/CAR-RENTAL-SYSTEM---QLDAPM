package com.carrental.booking.service;

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
import com.carrental.car.repository.CarRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import com.carrental.payment.entity.Payment;
import com.carrental.payment.entity.PaymentStatus;
import com.carrental.payment.entity.Refund;
import com.carrental.payment.repository.PaymentRepository;
import com.carrental.payment.repository.RefundRepository;
import com.carrental.user.entity.User;
import com.carrental.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    BookingMapper bookingMapper;
    PricingService pricingService;
    PaymentRepository paymentRepository;
    RefundRepository refundRepository;
    NotificationService notificationService;

    // ===== CREATE =====

    @Override
    @Transactional
    public BookingResponse createBooking(Long customerId, BookingRequest request) {
        log.info("Create booking: customerId={}, carId={}", customerId, request.getCarId());

        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

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
                .totalPrice(totalPrice)
                .depositAmount(depositAmount)
                .remainingAmount(remainingAmount)
                .status(BookingStatus.PENDING)
                .customerNote(request.getCustomerNote())
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        detail.setBookingId(savedBooking.getId());
        BookingDetail savedDetail = bookingDetailRepository.save(detail);

        log.info("Booking created: id={}, total={}", savedBooking.getId(), totalPrice);

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
        return bookingMapper.toResponseList(bookings);
    }

    @Override
    public List<BookingResponse> getOwnerBookings(Long ownerId) {
        List<Booking> bookings = bookingRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
        return bookingMapper.toResponseList(bookings);
    }

    @Override
    public List<BookingResponse> getBookingsByStatus(BookingStatus status) {
        List<Booking> bookings = bookingRepository.findByStatus(status);
        return bookingMapper.toResponseList(bookings);
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

        if (booking.getStatus() == BookingStatus.RENTED
                || booking.getStatus() == BookingStatus.COMPLETED
                || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException(ErrorCode.BOOKING_CANNOT_CANCEL,
                    "Không thể hủy đơn ở trạng thái này");
        }

        // ===== TÍNH HOÀN CỌC =====
        long refundAmount = calculateRefundAmount(booking);
        long depositPaid = booking.getDepositAmount();
        long lostAmount = depositPaid - refundAmount;

        log.info("Refund calculation: deposit={}, refund={}, lost={}",
                depositPaid, refundAmount, lostAmount);

        // ===== TẠO REFUND RECORD =====
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

        // ===== UPDATE BOOKING =====
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelReason(reason);
        booking.setCancelledAt(LocalDateTime.now());
        Booking updated = bookingRepository.save(booking);

        // ===== THÔNG BÁO OWNER =====
        try {
            notificationService.createNotification(
                    booking.getOwnerId(),
                    NotificationType.BOOKING_CANCELLED,
                    "Đơn bị hủy",
                    String.format("Đơn #%d đã bị khách hủy. Hoàn cọc: %dđ. Lý do: %s",
                            id, refundAmount, reason),
                    id
            );
        } catch (Exception e) {
            log.warn("Failed to notify owner: {}", e.getMessage());
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
        if (note != null) booking.setOwnerNote(note);

        Booking updated = bookingRepository.save(booking);

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

        // ===== OWNER REJECT → HOÀN 100% CỌC =====
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
                        .reason("Chủ xe từ chối: " + reason)
                        .status(PaymentStatus.PENDING)
                        .build();
                refundRepository.save(refund);
                log.info("Refund created for owner rejection: amount={}", refundAmount);
            }
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelReason("Chủ xe từ chối: " + reason);
        booking.setCancelledAt(LocalDateTime.now());

        Booking updated = bookingRepository.save(booking);

        try {
            notificationService.createNotification(
                    booking.getCustomerId(),
                    NotificationType.BOOKING_REJECTED,
                    "Đơn bị từ chối",
                    String.format("Đơn #%d đã bị chủ xe từ chối. Hoàn cọc: %dđ. Lý do: %s",
                            id, refundAmount, reason),
                    id
            );
        } catch (Exception e) {
            log.warn("Failed to notify customer: {}", e.getMessage());
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

        log.info("Rental completed: id={}", id);
        return buildResponse(updated, null);
    }

    // ===== HELPER =====

    /**
     * Tính số tiền hoàn cọc dựa trên chính sách:
     * - PENDING: 0đ
     * - Trước 24h: 100%
     * - Trong 24h: 70%
     * - Trong 4h: 50%
     * - Sau giờ nhận: 0%
     */
    private long calculateRefundAmount(Booking booking) {
        if (booking.getStatus() == BookingStatus.PENDING) {
            return 0;
        }

        long deposit = booking.getDepositAmount();
        if (deposit <= 0) return 0;

        long hoursUntilStart = Duration.between(
                LocalDateTime.now(),
                booking.getStartDate()
        ).toHours();

        if (hoursUntilStart >= 24) {
            return deposit;
        } else if (hoursUntilStart >= 4) {
            return (long)(deposit * 0.7);
        } else if (hoursUntilStart > 0) {
            return (long)(deposit * 0.5);
        } else {
            return 0;
        }
    }

    private BookingResponse buildResponse(Booking booking, BookingDetail detail) {
        BookingResponse response = bookingMapper.toResponse(booking);

        Car car = carRepository.findById(booking.getCarId()).orElse(null);
        if (car != null) {
            response.setCarName(car.getBrand() + " " + car.getModel());
            response.setCarPlate(car.getPlate());
        }

        User customer = userRepository.findById(booking.getCustomerId()).orElse(null);
        if (customer != null) {
            response.setCustomerName(customer.getName());
        }

        User owner = userRepository.findById(booking.getOwnerId()).orElse(null);
        if (owner != null) {
            response.setOwnerName(owner.getName());
        }

        if (detail != null) {
            response.setDetails(bookingMapper.toDetailResponse(detail));
        }

        return response;
    }
}