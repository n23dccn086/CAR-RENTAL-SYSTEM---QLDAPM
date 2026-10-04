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

    /** Thời gian tối đa để tài xế phản hồi (phút) */
    static final int RESPONSE_TIMEOUT_MINUTES = 5;

    // ===== ASSIGN =====

    @Override
    @Transactional
    public DriverAssignment assignDriverToBooking(Long bookingId) {
        log.info("Auto-assign driver for booking: {}", bookingId);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        // Check booking cần tài xế
        if (booking.getRentalMode() == null ||
                booking.getRentalMode().name().equals("SELF_DRIVE")) {
            log.info("Booking {} is self-drive, skip auto-assign", bookingId);
            return null;
        }

        // Tìm tài xế tốt nhất
        Driver driver = autoAssignService.findBestDriver(booking.getOwnerId(), booking);

        if (driver == null) {
            log.warn("No available driver for booking: {}", bookingId);
            // Thông báo cho owner
            try {
                notificationService.createNotification(
                        booking.getOwnerId(),
                        NotificationType.SYSTEM,
                        "Không có tài xế khả dụng",
                        String.format("Đơn #%d cần tài xế nhưng không có tài xế nào rảnh. Vui lòng gán thủ công.", bookingId),
                        bookingId
                );
            } catch (Exception e) {
                log.warn("Failed to send notification: {}", e.getMessage());
            }
            return null;
        }

        // Tạo assignment
        DriverAssignment assignment = createAssignment(booking, driver, 1);
        DriverAssignment saved = assignmentRepository.save(assignment);

        // Gửi thông báo cho tài xế qua SMS (mock)
        sendAssignmentNotification(saved, booking, driver);

        // Gửi thông báo cho owner
        try {
            notificationService.createNotification(
                    booking.getOwnerId(),
                    NotificationType.SYSTEM,
                    "Đã gán tài xế tự động",
                    String.format("Đơn #%d đã được gán cho tài xế %s. Chờ tài xế xác nhận.", bookingId, driver.getName()),
                    bookingId
            );
        } catch (Exception e) {
            log.warn("Failed to notify owner: {}", e.getMessage());
        }

        log.info("Driver assigned: bookingId={}, driverId={}, assignmentId={}",
                bookingId, driver.getId(), saved.getId());

        return saved;
    }

    @Override
    @Transactional
    public DriverAssignment assignNextDriver(Long bookingId) {
        log.info("Assign next driver for booking: {}", bookingId);

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        // Đếm số lần gán
        long attemptCount = assignmentRepository.countByBookingId(bookingId);

        // Nếu đã thử quá 5 lần → bỏ
        if (attemptCount >= 5) {
            log.warn("Max attempts reached for booking: {}", bookingId);
            notificationService.createNotification(
                    booking.getOwnerId(),
                    NotificationType.SYSTEM,
                    "Không thể tự động gán tài xế",
                    String.format("Đơn #%d đã thử gán %d tài xế nhưng không ai nhận. Vui lòng gán thủ công.", bookingId, attemptCount),
                    bookingId
            );
            return null;
        }

        // Tìm tài xế khác (loại trừ những tài xế đã từ chối)
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
                    String.format("Đơn #%d không còn tài xế nào rảnh. Vui lòng gán thủ công.", bookingId),
                    bookingId
            );
            return null;
        }

        DriverAssignment assignment = createAssignment(booking, driver, (int) attemptCount + 1);
        DriverAssignment saved = assignmentRepository.save(assignment);

        sendAssignmentNotification(saved, booking, driver);

        log.info("Next driver assigned: bookingId={}, driverId={}", bookingId, driver.getId());
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

        // Update assignment
        assignment.setStatus(AssignmentStatus.ACCEPTED);
        assignment.setRespondedAt(LocalDateTime.now());
        assignmentRepository.save(assignment);

        // Update booking
        Booking booking = bookingRepository.findById(assignment.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));
        booking.setDriverId(assignment.getDriverId());
        if (booking.getStatus() == BookingStatus.PAID) {
            booking.setStatus(BookingStatus.APPROVED);
        }
        bookingRepository.save(booking);

        // Update driver status
        Driver driver = driverRepository.findById(assignment.getDriverId()).orElse(null);
        if (driver != null) {
            driver.setStatus(DriverStatus.BUSY);
            driverRepository.save(driver);
        }

        // Thông báo cho owner
        try {
            String driverName = driver != null ? driver.getName() : "Tài xế";
            notificationService.createNotification(
                    booking.getOwnerId(),
                    NotificationType.SYSTEM,
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

        log.info("Assignment accepted: id={}, booking={}, driver={}",
                assignmentId, booking.getId(), assignment.getDriverId());
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

        log.info("Assignment rejected: id={}", assignmentId);

        // Gán tài xế tiếp theo
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

        log.info("Assignment expired: id={}", assignmentId);

        // Gán tài xế tiếp theo
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

        log.info("Assignment cancelled: id={}", assignmentId);
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

        // Gửi SMS (mock)
        notificationSender.send(driver.getPhone(), message);

        log.info("Assignment notification sent to driver: {} ({})",
                driver.getName(), driver.getPhone());
    }
}