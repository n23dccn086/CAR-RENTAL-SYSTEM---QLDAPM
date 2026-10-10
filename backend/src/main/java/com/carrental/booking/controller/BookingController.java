package com.carrental.booking.controller;

import com.carrental.booking.dto.*;
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
import org.springframework.http.HttpStatus;
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
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request,
            HttpServletRequest httpRequest) {

        Long customerId = extractUserId(httpRequest);
        log.info("REST request to create booking: customerId={}, carId={}",
                customerId, request.getCarId());

        BookingResponse response = bookingService.createBooking(customerId, request);
        return ApiResponse.success("Đơn đã được tạo, vui lòng thanh toán cọc", response);
    }

    // ===== READ =====

    /**
     * Lấy chi tiết đơn đặt xe
     * GET /api/v1/bookings/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<BookingResponse> getBookingById(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        log.info("REST request to get booking: {}", id);
        Long userId = null;
        try {
            userId = extractUserId(httpRequest);
        } catch (Exception ignored) {
        }
        return ApiResponse.success(bookingService.getBookingById(id, userId));
    }

    /**
     * Đơn của tôi (cần JWT - khách thuê)
     * GET /api/v1/bookings/my
     */
    @GetMapping("/my")
    public ApiResponse<List<BookingResponse>> getMyBookings(
            @RequestParam(required = false) String status,
            HttpServletRequest httpRequest) {
        Long customerId = extractUserId(httpRequest);
        log.info("REST request to get my bookings: customerId={}, status={}", customerId, status);

        return ApiResponse.success(bookingService.getMyBookings(customerId, status));
    }

    /**
     * Đơn của chủ xe (cần JWT - chủ xe)
     * GET /api/v1/bookings/owner
     */
    @GetMapping("/owner")
    public ApiResponse<List<BookingResponse>> getOwnerBookings(
            @RequestParam(required = false) String status,
            HttpServletRequest httpRequest) {
        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to get owner bookings: ownerId={}, status={}", ownerId, status);

        return ApiResponse.success(bookingService.getOwnerBookings(ownerId, status));
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
     * Khách hủy đơn (hỗ trợ cả POST theo API contract và PUT theo frontend)
     * POST /api/v1/bookings/{id}/cancel
     * PUT  /api/v1/bookings/{id}/cancel?reason=...
     */
    @RequestMapping(value = "/{id}/cancel", method = {RequestMethod.POST, RequestMethod.PUT})
    public ApiResponse<BookingResponse> cancelBooking(
            @PathVariable Long id,
            @RequestBody(required = false) CancelBookingRequest requestBody,
            @RequestParam(required = false) String reason,
            HttpServletRequest httpRequest) {

        Long customerId = extractUserId(httpRequest);
        String effectiveReason = (requestBody != null && requestBody.getReason() != null && !requestBody.getReason().isBlank())
                ? requestBody.getReason()
                : (reason != null ? reason : "Khách hủy");

        log.info("REST request to cancel booking: id={}, customerId={}, reason={}", id, customerId, effectiveReason);

        return ApiResponse.success("Hủy đơn thành công",
                bookingService.cancelBooking(id, customerId, effectiveReason));
    }

    /**
     * Chủ xe duyệt đơn (hỗ trợ cả POST theo API contract và PUT theo frontend)
     * POST /api/v1/bookings/{id}/approve
     * PUT  /api/v1/bookings/{id}/approve?note=...
     */
    @RequestMapping(value = "/{id}/approve", method = {RequestMethod.POST, RequestMethod.PUT})
    public ApiResponse<BookingResponse> approveBooking(
            @PathVariable Long id,
            @RequestBody(required = false) ApproveBookingRequest requestBody,
            @RequestParam(required = false) String note,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        String effectiveNote = (requestBody != null && requestBody.getNote() != null)
                ? requestBody.getNote()
                : note;

        log.info("REST request to approve booking: id={}, ownerId={}, note={}", id, ownerId, effectiveNote);

        return ApiResponse.success("Đã duyệt đơn",
                bookingService.approveBooking(id, ownerId, effectiveNote));
    }

    /**
     * Chủ xe từ chối đơn (hỗ trợ cả POST theo API contract và PUT theo frontend)
     * POST /api/v1/bookings/{id}/reject
     * PUT  /api/v1/bookings/{id}/reject?reason=...
     */
    @RequestMapping(value = "/{id}/reject", method = {RequestMethod.POST, RequestMethod.PUT})
    public ApiResponse<BookingResponse> rejectBooking(
            @PathVariable Long id,
            @RequestBody(required = false) RejectBookingRequest requestBody,
            @RequestParam(required = false) String reason,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        String effectiveReason = (requestBody != null && requestBody.getReason() != null && !requestBody.getReason().isBlank())
                ? requestBody.getReason()
                : (reason != null ? reason : "Chủ xe từ chối");

        log.info("REST request to reject booking: id={}, ownerId={}, reason={}", id, ownerId, effectiveReason);

        return ApiResponse.success("Đã từ chối đơn, hoàn cọc cho khách",
                bookingService.rejectBooking(id, ownerId, effectiveReason));
    }

    /**
     * Cập nhật trạng thái đơn (Unified Status Transition - Contract Section 4.7)
     * PUT /api/v1/bookings/{id}/status
     */
    @PutMapping("/{id}/status")
    public ApiResponse<BookingResponse> updateBookingStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBookingStatusRequest request,
            HttpServletRequest httpRequest) {

        Long userId = extractUserId(httpRequest);
        log.info("REST request to update booking status: id={}, userId={}, status={}, note={}",
                id, userId, request.getStatus(), request.getNote());

        return ApiResponse.success("Cập nhật trạng thái đơn thành công",
                bookingService.updateStatus(id, userId, request.getStatus(), request.getNote()));
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