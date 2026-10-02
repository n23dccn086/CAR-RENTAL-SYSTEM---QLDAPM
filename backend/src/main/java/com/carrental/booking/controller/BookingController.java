package com.carrental.booking.controller;

import com.carrental.booking.dto.BookingRequest;
import com.carrental.booking.dto.BookingResponse;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.service.BookingService;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.dto.ApiResponse;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.common.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BookingController {

    BookingService bookingService;
    JwtService jwtService;

    // ===== CREATE =====

    /**
     * Tạo đơn đặt xe (cần JWT - khách thuê)
     * POST /api/v1/bookings
     */
    @PostMapping
    public ApiResponse<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request,
            HttpServletRequest httpRequest) {

        Long customerId = extractUserId(httpRequest);
        log.info("REST request to create booking: customerId={}, carId={}",
                customerId, request.getCarId());

        BookingResponse response = bookingService.createBooking(customerId, request);
        return ApiResponse.success("Tạo đơn đặt xe thành công. Vui lòng thanh toán cọc.", response);
    }

    // ===== READ =====

    /**
     * Lấy chi tiết đơn đặt xe
     * GET /api/v1/bookings/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<BookingResponse> getBookingById(@PathVariable Long id) {
        log.info("REST request to get booking: {}", id);
        return ApiResponse.success(bookingService.getBookingById(id));
    }

    /**
     * Đơn của tôi (cần JWT - khách thuê)
     * GET /api/v1/bookings/my
     */
    @GetMapping("/my")
    public ApiResponse<List<BookingResponse>> getMyBookings(HttpServletRequest httpRequest) {
        Long customerId = extractUserId(httpRequest);
        log.info("REST request to get my bookings: customerId={}", customerId);

        return ApiResponse.success(bookingService.getMyBookings(customerId));
    }

    /**
     * Đơn của chủ xe (cần JWT - chủ xe)
     * GET /api/v1/bookings/owner
     */
    @GetMapping("/owner")
    public ApiResponse<List<BookingResponse>> getOwnerBookings(HttpServletRequest httpRequest) {
        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to get owner bookings: ownerId={}", ownerId);

        return ApiResponse.success(bookingService.getOwnerBookings(ownerId));
    }

    /**
     * Lọc đơn theo trạng thái
     * GET /api/v1/bookings/status/{status}
     */
    @GetMapping("/status/{status}")
    public ApiResponse<List<BookingResponse>> getBookingsByStatus(@PathVariable BookingStatus status) {
        log.info("REST request to get bookings by status: {}", status);
        return ApiResponse.success(bookingService.getBookingsByStatus(status));
    }

    // ===== ACTIONS =====

    /**
     * Khách hủy đơn
     * PUT /api/v1/bookings/{id}/cancel?reason=...
     */
    @PutMapping("/{id}/cancel")
    public ApiResponse<BookingResponse> cancelBooking(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            HttpServletRequest httpRequest) {

        Long customerId = extractUserId(httpRequest);
        log.info("REST request to cancel booking: id={}, customerId={}", id, customerId);

        return ApiResponse.success("Hủy đơn thành công",
                bookingService.cancelBooking(id, customerId, reason));
    }

    /**
     * Chủ xe duyệt đơn
     * PUT /api/v1/bookings/{id}/approve
     */
    @PutMapping("/{id}/approve")
    public ApiResponse<BookingResponse> approveBooking(
            @PathVariable Long id,
            @RequestParam(required = false) String note,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to approve booking: id={}, ownerId={}", id, ownerId);

        return ApiResponse.success("Duyệt đơn thành công",
                bookingService.approveBooking(id, ownerId, note));
    }

    /**
     * Chủ xe từ chối đơn
     * PUT /api/v1/bookings/{id}/reject?reason=...
     */
    @PutMapping("/{id}/reject")
    public ApiResponse<BookingResponse> rejectBooking(
            @PathVariable Long id,
            @RequestParam String reason,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to reject booking: id={}, ownerId={}", id, ownerId);

        return ApiResponse.success("Từ chối đơn thành công",
                bookingService.rejectBooking(id, ownerId, reason));
    }

    /**
     * Đánh dấu đã thanh toán cọc
     * PUT /api/v1/bookings/{id}/paid
     */
    @PutMapping("/{id}/paid")
    public ApiResponse<BookingResponse> markAsPaid(@PathVariable Long id) {
        log.info("REST request to mark as paid: {}", id);
        return ApiResponse.success("Đã ghi nhận thanh toán cọc", bookingService.markAsPaid(id));
    }

    /**
     * Chủ xe bắt đầu cho thuê
     * PUT /api/v1/bookings/{id}/start
     */
    @PutMapping("/{id}/start")
    public ApiResponse<BookingResponse> startRental(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to start rental: id={}, ownerId={}", id, ownerId);

        return ApiResponse.success("Bắt đầu cho thuê", bookingService.startRental(id, ownerId));
    }

    /**
     * Chủ xe hoàn tất thuê
     * PUT /api/v1/bookings/{id}/complete
     */
    @PutMapping("/{id}/complete")
    public ApiResponse<BookingResponse> completeRental(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to complete rental: id={}, ownerId={}", id, ownerId);

        return ApiResponse.success("Hoàn tất cho thuê", bookingService.completeRental(id, ownerId));
    }

    // ===== HELPER =====

    private Long extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException(ErrorCode.UNAUTHENTICATED);
        }
        String token = authHeader.substring(7);
        return jwtService.extractUserId(token);
    }
}