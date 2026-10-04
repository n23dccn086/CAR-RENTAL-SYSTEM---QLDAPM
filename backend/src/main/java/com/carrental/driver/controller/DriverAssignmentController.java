package com.carrental.driver.controller;

import com.carrental.booking.entity.Booking;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.car.entity.Car;
import com.carrental.car.repository.CarRepository;
import com.carrental.common.dto.ApiResponse;
import com.carrental.driver.dto.DriverAssignmentResponse;
import com.carrental.driver.entity.Driver;
import com.carrental.driver.entity.DriverAssignment;
import com.carrental.driver.repository.DriverRepository;
import com.carrental.driver.service.DriverAssignmentService;
import com.carrental.user.entity.User;
import com.carrental.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller cho luồng gán tài xế.
 * - API không cần login (magic link cho tài xế).
 * - API cho owner (cần JWT).
 */
@RestController
@RequestMapping("/driver/assignments")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class DriverAssignmentController {

    DriverAssignmentService assignmentService;
    DriverRepository driverRepository;
    BookingRepository bookingRepository;
    CarRepository carRepository;
    UserRepository userRepository;

    // ===== MAGIC LINK (không cần login) =====

    /**
     * Lấy chi tiết assignment qua magic link.
     * GET /api/v1/driver/assignments/{id}?token=xxx
     */
    @GetMapping("/{id}")
    public ApiResponse<DriverAssignmentResponse> getAssignment(
            @PathVariable Long id,
            @RequestParam String token) {
        log.info("GET assignment: id={}", id);
        DriverAssignment assignment = assignmentService.getAssignmentByIdAndToken(id, token);
        return ApiResponse.success(buildResponse(assignment));
    }

    /**
     * Tài xế bấm "Nhận chuyến".
     * POST /api/v1/driver/assignments/{id}/accept?token=xxx
     */
    @PostMapping("/{id}/accept")
    public ApiResponse<DriverAssignmentResponse> accept(
            @PathVariable Long id,
            @RequestParam String token) {
        log.info("ACCEPT assignment: id={}", id);
        assignmentService.acceptAssignment(id, token);
        DriverAssignment assignment = assignmentService.getAssignmentByIdAndToken(id, token);
        return ApiResponse.success("Đã nhận chuyến", buildResponse(assignment));
    }

    /**
     * Tài xế bấm "Từ chối".
     * POST /api/v1/driver/assignments/{id}/reject?token=xxx&reason=...
     */
    @PostMapping("/{id}/reject")
    public ApiResponse<DriverAssignmentResponse> reject(
            @PathVariable Long id,
            @RequestParam String token,
            @RequestParam(required = false) String reason) {
        log.info("REJECT assignment: id={}, reason={}", id, reason);
        assignmentService.rejectAssignment(id, token, reason);
        DriverAssignment assignment = assignmentService.getAssignmentByIdAndToken(id, token);
        return ApiResponse.success("Đã từ chối chuyến", buildResponse(assignment));
    }

    // ===== OWNER APIs =====

    /**
     * Owner trigger auto-assign cho booking.
     * POST /api/v1/driver/assignments/booking/{bookingId}/auto-assign
     */
    @PostMapping("/booking/{bookingId}/auto-assign")
    public ApiResponse<DriverAssignmentResponse> autoAssign(
            @PathVariable Long bookingId) {
        log.info("AUTO-ASSIGN for booking: {}", bookingId);
        DriverAssignment assignment = assignmentService.assignDriverToBooking(bookingId);
        if (assignment == null) {
            return ApiResponse.error(9002,
                    "Không có tài xế rảnh. Vui lòng gán thủ công.");
        }
        return ApiResponse.success("Đã gán tài xế", buildResponse(assignment));
    }

    /**
     * Lấy danh sách assignment của booking.
     * GET /api/v1/driver/assignments/booking/{bookingId}
     */
    @GetMapping("/booking/{bookingId}")
    public ApiResponse<List<DriverAssignmentResponse>> getByBooking(
            @PathVariable Long bookingId) {
        log.info("GET assignments by booking: {}", bookingId);
        List<DriverAssignment> list = assignmentService.getAssignmentsByBooking(bookingId);
        List<DriverAssignmentResponse> responses = list.stream()
                .map(this::buildResponse)
                .toList();
        return ApiResponse.success(responses);
    }

    // ===== HELPER =====

    private DriverAssignmentResponse buildResponse(DriverAssignment assignment) {
        Driver driver = driverRepository.findById(assignment.getDriverId()).orElse(null);
        Booking booking = bookingRepository.findById(assignment.getBookingId()).orElse(null);

        DriverAssignmentResponse.DriverAssignmentResponseBuilder builder =
                DriverAssignmentResponse.builder()
                        .id(assignment.getId())
                        .bookingId(assignment.getBookingId())
                        .driverId(assignment.getDriverId())
                        .token(assignment.getToken())
                        .status(assignment.getStatus().name())
                        .rejectReason(assignment.getRejectReason())
                        .deadlineAt(assignment.getDeadlineAt())
                        .respondedAt(assignment.getRespondedAt())
                        .attemptNumber(assignment.getAttemptNumber())
                        .createdAt(assignment.getCreatedAt());

        if (driver != null) {
            builder.driverName(driver.getName())
                    .driverPhone(driver.getPhone());
        }

        if (booking != null) {
            builder.startDate(booking.getStartDate())
                    .endDate(booking.getEndDate())
                    .pickupAddress(booking.getPickupAddress());

            Car car = carRepository.findById(booking.getCarId()).orElse(null);
            if (car != null) {
                builder.carName(car.getBrand() + " " + car.getModel())
                        .carPlate(car.getPlate());
            }

            User customer = userRepository.findById(booking.getCustomerId()).orElse(null);
            if (customer != null) {
                builder.customerName(customer.getName());
            }
        }

        return builder.build();
    }
}