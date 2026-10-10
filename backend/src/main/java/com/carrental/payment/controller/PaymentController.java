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

    /**
     * Contract 5.1: POST /payments
     */
    @PostMapping
    public ApiResponse<Object> createPayment(
            @Valid @RequestBody PaymentRequest request,
            HttpServletRequest httpRequest) {

        Long customerId = extractUserId(httpRequest);
        log.info("REST request to create payment: customerId={}, bookingId={}",
                customerId, request.getBookingId());

        PaymentResponse response = paymentService.createPayment(customerId, request);

        java.util.Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("id", response.getId());
        data.put("payment_id", response.getId());
        data.put("transaction_id", response.getTransactionId());
        data.put("payment_url", response.getPaymentUrl());
        data.put("qr_code", response.getQr_code());
        data.put("expires_at", response.getExpires_at());
        data.put("booking_id", response.getBookingId());
        data.put("amount", response.getAmount());
        data.put("status", response.getStatus());

        return ApiResponse.success("Tạo giao dịch thành công. Vui lòng thanh toán.", data);
    }

    // ===== READ =====

    /**
     * Contract 5.3: GET /payments/:id
     */
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

    /**
     * Contract 5.4: GET /payments/my?page=1&limit=20
     */
    @GetMapping("/my")
    public ApiResponse<Object> getMyPayments(
            HttpServletRequest httpRequest,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {
        Long customerId = extractUserId(httpRequest);
        log.info("REST request to get my payments: customerId={}, page={}, limit={}",
                customerId, page, limit);

        int pageNum = page != null ? (page > 0 ? page - 1 : 0) : 0;
        int pageSize = limit != null ? limit : 20;

        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(
                        pageNum, pageSize, org.springframework.data.domain.Sort.by(
                                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));

        org.springframework.data.domain.Page<PaymentResponse> paged =
                paymentService.getMyPaymentsPaged(customerId, pageable);

        java.util.Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("payments", paged.getContent());
        data.put("content", paged.getContent());

        java.util.Map<String, Object> pagination = new java.util.LinkedHashMap<>();
        pagination.put("page", paged.getNumber() + 1);
        pagination.put("limit", paged.getSize());
        pagination.put("total", paged.getTotalElements());
        pagination.put("total_pages", paged.getTotalPages());
        data.put("pagination", pagination);

        return ApiResponse.success(data);
    }

    // ===== CALLBACK =====

    /**
     * Contract 5.2: POST /payments/callback/:gateway
     */
    @PostMapping("/callback/{gateway}")
    public ApiResponse<Object> gatewayCallback(
            @PathVariable String gateway,
            @RequestBody(required = false) String callbackData) {
        log.info("REST: Gateway {} callback received: {}", gateway, callbackData);
        if ("momo".equalsIgnoreCase(gateway) && callbackData != null) {
            paymentService.handleMomoCallback(callbackData);
        }
        return ApiResponse.success("OK");
    }

    @PostMapping("/callback/momo")
    public ApiResponse<Object> momoCallback(@RequestBody(required = false) String callbackData) {
        log.info("Momo callback received: {}", callbackData);
        if (callbackData != null) {
            paymentService.handleMomoCallback(callbackData);
        }
        return ApiResponse.success("OK");
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