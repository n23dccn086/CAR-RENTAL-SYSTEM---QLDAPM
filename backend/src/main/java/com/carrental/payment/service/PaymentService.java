package com.carrental.payment.service;

import com.carrental.payment.dto.PaymentRequest;
import com.carrental.payment.dto.PaymentResponse;
import com.carrental.payment.entity.Payment;

import java.util.List;

public interface PaymentService {

    // ===== CREATE =====

    PaymentResponse createPayment(Long customerId, PaymentRequest request);

    // ===== READ =====

    PaymentResponse getPaymentById(Long id);

    Payment getPaymentEntityById(Long id);

    List<PaymentResponse> getPaymentsByBooking(Long bookingId);

    List<PaymentResponse> getMyPayments(Long customerId);

    org.springframework.data.domain.Page<PaymentResponse> getMyPaymentsPaged(
            Long customerId, org.springframework.data.domain.Pageable pageable);

    // ===== CALLBACK =====

    PaymentResponse handleMomoCallback(String callbackData);

    /** MOCK callback để chuyển trạng thái khi demo (thay Momo callback thật) */
    PaymentResponse handleMockCallback(Long paymentId, String method);

    // ===== REFUND =====

    PaymentResponse refundPayment(Long paymentId, String reason);
}