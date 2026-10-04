package com.carrental.payment.controller;

import com.carrental.common.constant.ErrorCode;
import com.carrental.common.dto.ApiResponse;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.common.security.JwtService;
import com.carrental.payment.dto.PaymentRequest;
import com.carrental.payment.dto.PaymentResponse;
import com.carrental.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PaymentController {

    PaymentService paymentService;
    JwtService jwtService;

    // ===== CREATE =====

    @PostMapping
    public ApiResponse<PaymentResponse> createPayment(
            @Valid @RequestBody PaymentRequest request,
            HttpServletRequest httpRequest) {

        Long customerId = extractUserId(httpRequest);
        log.info("REST request to create payment: customerId={}, bookingId={}",
                customerId, request.getBookingId());

        PaymentResponse response = paymentService.createPayment(customerId, request);
        return ApiResponse.success("Tạo giao dịch thành công. Vui lòng thanh toán.", response);
    }

    // ===== READ =====

    @GetMapping("/{id}")
    public ApiResponse<PaymentResponse> getPaymentById(@PathVariable Long id) {
        log.info("REST request to get payment: {}", id);
        return ApiResponse.success(paymentService.getPaymentById(id));
    }

    @GetMapping("/booking/{bookingId}")
    public ApiResponse<List<PaymentResponse>> getPaymentsByBooking(@PathVariable Long bookingId) {
        log.info("REST request to get payments by booking: {}", bookingId);
        return ApiResponse.success(paymentService.getPaymentsByBooking(bookingId));
    }

    @GetMapping("/my")
    public ApiResponse<List<PaymentResponse>> getMyPayments(HttpServletRequest httpRequest) {
        Long customerId = extractUserId(httpRequest);
        log.info("REST request to get my payments: customerId={}", customerId);
        return ApiResponse.success(paymentService.getMyPayments(customerId));
    }

    // ===== CALLBACK =====

    @PostMapping("/callback/momo")
    public ApiResponse<PaymentResponse> momoCallback(@RequestBody String callbackData) {
        log.info("Momo callback received: {}", callbackData);
        return ApiResponse.success("Callback processed",
                paymentService.handleMomoCallback(callbackData));
    }

    /**
     * MOCK callback — dùng khi demo để chuyển trạng thái thanh toán.
     * POST /api/v1/payments/{id}/mock-success?method=MOMO
     */
    @PostMapping("/{id}/mock-success")
    public ApiResponse<PaymentResponse> mockSuccess(
            @PathVariable Long id,
            @RequestParam(defaultValue = "MOMO") String method) {
        log.info("MOCK: Simulating payment success for payment: {}, method: {}", id, method);
        return ApiResponse.success("Thanh toán thành công (demo)",
                paymentService.handleMockCallback(id, method));
    }

    // ===== REFUND =====

    @PostMapping("/{id}/refund")
    public ApiResponse<PaymentResponse> refundPayment(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {

        log.info("REST request to refund payment: id={}, reason={}", id, reason);
        return ApiResponse.success("Hoàn tiền thành công",
                paymentService.refundPayment(id, reason));
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