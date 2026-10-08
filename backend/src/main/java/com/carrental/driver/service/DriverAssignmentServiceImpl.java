package com.carrental.driver.service;

import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.car.entity.Car;
import com.carrental.car.repository.CarRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.driver.entity.AssignmentStatus;
import com.carrental.driver.entity.Driver;
import com.carrental.driver.entity.DriverAssignment;
import com.carrental.driver.entity.DriverStatus;
import com.carrental.driver.repository.DriverAssignmentRepository;
import com.carrental.driver.repository.DriverRepository;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import com.carrental.notification.service.NotificationSender;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class DriverAssignmentServiceImpl implements DriverAssignmentService {

    DriverAssignmentRepository assignmentRepository;
    DriverRepository driverRepository;
    BookingRepository bookingRepository;
    CarRepository carRepository;
    AutoAssignService autoAssignService;
    NotificationSender notificationSender;
    NotificationService notificationService;

    static final int RESPONSE_TIMEOUT_MINUTES = 5;

    // ===== ASSIGN (AUTO) =====

    @Override
    @Transactional
    public DriverAssignment assignDriverToBooking(Long bookingId) {
        log.info("Auto-assign driver for booking: {}", bookingId);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        if (booking.getRentalMode() == null ||
                booking.getRentalMode().name().equals("SELF_DRIVE")) {
            log.info("Booking {} is self-drive, skip auto-assign", bookingId);
            return null;
        }

        Driver driver = autoAssignService.findBestDriver(booking.getOwnerId(), booking);

        if (driver == null) {
            log.warn("No available driver for booking: {}", bookingId);
            try {
                notificationService.createNotification(
                        booking.getOwnerId(),
                        NotificationType.SYSTEM,
                        "Không có tài xế khả dụng",
                        String.format("Đơn #%d cần tài xế nhưng không có tài xế nào rảnh.", bookingId),
                        bookingId
                );
            } catch (Exception e) {
                log.warn("Failed to send notification: {}", e.getMessage());
            }
            return null;
        }

        DriverAssignment assignment = createAssignment(booking, driver, 1);
        DriverAssignment saved = assignmentRepository.save(assignment);

        sendAssignmentNotification(saved, booking, driver);

        try {
            notificationService.createNotification(
                    booking.getOwnerId(),
                    NotificationType.BOOKING_DRIVER_ASSIGNED,
                    "Đã gán tài xế tự động",
                    String.format("Đơn #%d đã được gán cho tài xế %s.", bookingId, driver.getName()),
                    bookingId
            );
        } catch (Exception e) {
            log.warn("Failed to notify owner: {}", e.getMessage());
        }

        return saved;
    }

    @Override
    @Transactional
    public DriverAssignment assignSelectedDriver(Booking booking) {
        log.info("Assign selected driver: bookingId={}, driverId={}",
                booking.getId(), booking.getDriverId());

        if (booking.getDriverId() == null) {
            log.warn("Booking {} has no driverId, skip", booking.getId());
            return null;
        }

        Driver driver = driverRepository.findById(booking.getDriverId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DRIVER_NOT_FOUND));

        DriverAssignment assignment = createAssignment(booking, driver, 1);
        DriverAssignment saved = assignmentRepository.save(assignment);

        sendAssignmentNotification(saved, booking, driver);

        try {
            notificationService.createNotification(
                    booking.getOwnerId(),
                    NotificationType.BOOKING_DRIVER_ASSIGNED,
                    "Đã gửi yêu cầu cho tài xế",
                    String.format("Đơn #%d đã gửi yêu cầu cho tài xế %s. Chờ tài xế xác nhận.",
                            booking.getId(), driver.getName()),
                    booking.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to notify owner: {}", e.getMessage());
        }

        log.info("Selected driver assignment created: id={} for booking {} → driver {}",
                saved.getId(), booking.getId(), driver.getId());

        return saved;
    }

    @Override
    @Transactional
    public DriverAssignment assignNextDriver(Long bookingId) {
        log.info("Assign next driver for booking: {}", bookingId);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        long attemptCount = assignmentRepository.countByBookingId(bookingId);

        if (attemptCount >= 5) {
            log.warn("Max attempts reached for booking: {}", bookingId);
            notificationService.createNotification(
                    booking.getOwnerId(),
                    NotificationType.SYSTEM,
                    "Không thể tự động gán tài xế",
                    String.format("Đơn #%d đã thử gán %d tài xế nhưng không ai nhận.",
                            bookingId, attemptCount),
                    bookingId
            );
            return null;
        }

        List<Long> rejectedDriverIds = assignmentRepository
                .findByBookingIdOrderByCreatedAtDesc(bookingId)
                .stream()
                .filter(a -> a.getStatus() == AssignmentStatus.REJECTED
                        || a.getStatus() == AssignmentStatus.EXPIRED)
                .map(DriverAssignment::getDriverId)
                .toList();

        Driver driver = autoAssignService.findBestDriverExcluding(
                booking.getOwnerId(), booking, rejectedDriverIds);

        if (driver == null) {
            log.warn("No more available drivers for booking: {}", bookingId);
            notificationService.createNotification(
                    booking.getOwnerId(),
                    NotificationType.SYSTEM,
                    "Không còn tài xế khả dụng",
                    String.format("Đơn #%d không còn tài xế nào rảnh.", bookingId),
                    bookingId
            );
            return null;
        }

        DriverAssignment assignment = createAssignment(booking, driver, (int) attemptCount + 1);
        DriverAssignment saved = assignmentRepository.save(assignment);

        sendAssignmentNotification(saved, booking, driver);

        return saved;
    }

    // ===== ACCEPT / REJECT / EXPIRE =====

    @Override
    @Transactional
    public void acceptAssignment(Long assignmentId, String token) {
        log.info("Accept assignment: id={}", assignmentId);

        DriverAssignment assignment = getAssignmentByIdAndToken(assignmentId, token);

        if (assignment.getStatus() != AssignmentStatus.PENDING) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Assignment đã được xử lý");
        }

        if (assignment.getDeadlineAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Đã hết hạn phản hồi");
        }

        assignment.setStatus(AssignmentStatus.ACCEPTED);
        assignment.setRespondedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);

        Booking booking = bookingRepository.findById(assignment.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        if (booking.getDriverId() == null) {
            booking.setDriverId(assignment.getDriverId());
        }

        if (booking.getStatus() == BookingStatus.PAID) {
            booking.setStatus(BookingStatus.APPROVED);
        }
        bookingRepository.save(booking);

        Driver driver = driverRepository.findById(assignment.getDriverId()).orElse(null);
        if (driver != null) {
            driver.setStatus(DriverStatus.BUSY);
            driverRepository.save(driver);
        }

        // ★ Thông báo cho Owner + Customer
        try {
            String driverName = driver != null ? driver.getName() : "Tài xế";
            notificationService.createNotification(
                    booking.getOwnerId(),
                    NotificationType.BOOKING_DRIVER_ACCEPTED,
                    "Tài xế đã nhận chuyến",
                    String.format("Tài xế %s đã nhận đơn #%d.", driverName, booking.getId()),
                    booking.getId()
            );
            notificationService.createNotification(
                    booking.getCustomerId(),
                    NotificationType.BOOKING_APPROVED,
                    "Đơn đã được xác nhận",
                    String.format("Đơn #%d đã được chủ xe xác nhận và gán tài xế.", booking.getId()),
                    booking.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to send notifications: {}", e.getMessage());
        }
    }

    @Override
    @Transactional
    public void rejectAssignment(Long assignmentId, String token, String reason) {
        log.info("Reject assignment: id={}, reason={}", assignmentId, reason);

        DriverAssignment assignment = getAssignmentByIdAndToken(assignmentId, token);

        if (assignment.getStatus() != AssignmentStatus.PENDING) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Assignment đã được xử lý");
        }

        assignment.setStatus(AssignmentStatus.REJECTED);
        assignment.setRejectReason(reason);
        assignment.setRespondedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);

        // ★ Thông báo cho Owner
        try {
            Booking booking = bookingRepository.findById(assignment.getBookingId()).orElse(null);
            if (booking != null) {
                Driver driver = driverRepository.findById(assignment.getDriverId()).orElse(null);
                String driverName = driver != null ? driver.getName() : "Tài xế";
                notificationService.createNotification(
                        booking.getOwnerId(),
                        NotificationType.BOOKING_DRIVER_REJECTED,
                        "Tài xế từ chối chuyến",
                        String.format("Tài xế %s đã từ chối đơn #%d. Đang tìm tài xế khác.",
                                driverName, booking.getId()),
                        booking.getId()
                );
            }
        } catch (Exception e) {
            log.warn("Failed to notify owner: {}", e.getMessage());
        }

        assignNextDriver(assignment.getBookingId());
    }

    @Override
    @Transactional
    public void expireAssignment(Long assignmentId) {
        log.info("Expire assignment: id={}", assignmentId);

        DriverAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.VALIDATION_ERROR));

        if (assignment.getStatus() != AssignmentStatus.PENDING) {
            return;
        }

        assignment.setStatus(AssignmentStatus.EXPIRED);
        assignment.setRespondedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);

        assignNextDriver(assignment.getBookingId());
    }

    @Override
    @Transactional
    public void cancelAssignment(Long assignmentId, Long ownerId) {
        log.info("Cancel assignment: id={}, ownerId={}", assignmentId, ownerId);

        DriverAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.VALIDATION_ERROR));

        Booking booking = bookingRepository.findById(assignment.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        if (!booking.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED);
        }

        assignment.setStatus(AssignmentStatus.CANCELLED);
        assignment.setRespondedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);
    }

    // ===== READ =====

    @Override
    public DriverAssignment getAssignmentByIdAndToken(Long id, String token) {
        DriverAssignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.VALIDATION_ERROR));

        if (!assignment.getToken().equals(token)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Token không hợp lệ");
        }

        return assignment;
    }

    @Override
    public List<DriverAssignment> getAssignmentsByBooking(Long bookingId) {
        return assignmentRepository.findByBookingIdOrderByCreatedAtDesc(bookingId);
    }

    // ===== HELPER =====

    private DriverAssignment createAssignment(Booking booking, Driver driver, int attempt) {
        String token = UUID.randomUUID().toString().replace("-", "");

        return DriverAssignment.builder()
                .bookingId(booking.getId())
                .driverId(driver.getId())
                .token(token)
                .status(AssignmentStatus.PENDING)
                .deadlineAt(LocalDateTime.now().plusMinutes(RESPONSE_TIMEOUT_MINUTES))
                .attemptNumber(attempt)
                .build();
    }

    private void sendAssignmentNotification(DriverAssignment assignment, Booking booking, Driver driver) {
        Car car = carRepository.findById(booking.getCarId()).orElse(null);
        String carInfo = car != null ? car.getBrand() + " " + car.getModel() : "Xe";

        String magicLink = String.format(
                "http://localhost:5173/driver/assignment/%d?token=%s",
                assignment.getId(), assignment.getToken()
        );

        String message = String.format(
                "[MAISON] Ban duoc phan cong chuyen #%d. Xe: %s. Tu %s den %s. Xac nhan trong %d phut: %s",
                booking.getId(),
                carInfo,
                booking.getStartDate(),
                booking.getEndDate(),
                RESPONSE_TIMEOUT_MINUTES,
                magicLink
        );

        notificationSender.send(driver.getPhone(), message);

        log.info("Assignment notification sent to driver: {} ({})",
                driver.getName(), driver.getPhone());
    }
}