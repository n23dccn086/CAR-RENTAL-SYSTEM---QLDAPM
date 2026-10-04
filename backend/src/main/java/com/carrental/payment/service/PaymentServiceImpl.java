package com.carrental.payment.service;

import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import com.carrental.payment.dto.PaymentMapper;
import com.carrental.payment.dto.PaymentRequest;
import com.carrental.payment.dto.PaymentResponse;
import com.carrental.payment.entity.*;
import com.carrental.payment.gateway.MomoGateway;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    PaymentRepository paymentRepository;
    RefundRepository refundRepository;
    BookingRepository bookingRepository;
    UserRepository userRepository;
    PaymentMapper paymentMapper;
    MomoGateway momoGateway;
    NotificationService notificationService;

    // ===== CREATE =====

    @Override
    @Transactional
    public PaymentResponse createPayment(Long customerId, PaymentRequest request) {
        log.info("Create payment: customerId={}, bookingId={}", customerId, request.getBookingId());

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        if (!booking.getCustomerId().equals(customerId)) {
            throw new UnauthorizedException(ErrorCode.BOOKING_NOT_OWNED);
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException(ErrorCode.BOOKING_STATUS_INVALID);
        }

        String transactionId = "TXN_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Payment payment = Payment.builder()
                .bookingId(request.getBookingId())
                .customerId(customerId)
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .paymentType(request.getPaymentType())
                .transactionId(transactionId)
                .status(PaymentStatus.PENDING)
                .build();

        Payment saved = paymentRepository.save(payment);

        String paymentUrl = switch (request.getPaymentMethod()) {
            case MOMO -> momoGateway.createPaymentUrl(saved);
            case VNPAY, ZALOPAY, BANKING -> "https://demo-payment-gateway.com/pay?txn=" + transactionId;
        };

        saved.setPaymentUrl(paymentUrl);
        saved = paymentRepository.save(saved);

        log.info("Payment created: id={}, txnId={}", saved.getId(), transactionId);

        return buildResponse(saved);
    }

    // ===== READ =====

    @Override
    public PaymentResponse getPaymentById(Long id) {
        Payment payment = getPaymentEntityById(id);
        return buildResponse(payment);
    }

    @Override
    public Payment getPaymentEntityById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PAYMENT_NOT_FOUND));
    }

    @Override
    public List<PaymentResponse> getPaymentsByBooking(Long bookingId) {
        List<Payment> payments = paymentRepository.findByBookingId(bookingId);
        return payments.stream().map(this::buildResponse).toList();
    }

    @Override
    public List<PaymentResponse> getMyPayments(Long customerId) {
        List<Payment> payments = paymentRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        return payments.stream().map(this::buildResponse).toList();
    }

    // ===== CALLBACK (Momo thật — giữ nguyên) =====

    @Override
    @Transactional
    public PaymentResponse handleMomoCallback(String callbackData) {
        log.info("Handle Momo callback: {}", callbackData);

        if (!momoGateway.verifySignature(callbackData)) {
            throw new BadRequestException(ErrorCode.PAYMENT_INVALID_SIGNATURE);
        }

        boolean isSuccess = momoGateway.isPaymentSuccess(callbackData);

        Payment payment = paymentRepository.findByStatus(PaymentStatus.PENDING)
                .stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PAYMENT_NOT_FOUND));

        if (isSuccess) {
            payment.setStatus(PaymentStatus.SUCCESS);
            payment.setPaidAt(LocalDateTime.now());
            payment.setGatewayTransactionId(momoGateway.extractGatewayTransactionId(callbackData));

            Booking booking = bookingRepository.findById(payment.getBookingId()).orElse(null);
            if (booking != null && booking.getStatus() == BookingStatus.PENDING) {
                booking.setStatus(BookingStatus.PAID);
                bookingRepository.save(booking);
                log.info("Booking updated to PAID: id={}", booking.getId());
            }
        } else {
            payment.setStatus(PaymentStatus.FAILED);
        }

        payment.setGatewayResponse(callbackData);
        Payment updated = paymentRepository.save(payment);

        log.info("Momo callback processed: paymentId={}, status={}", updated.getId(), updated.getStatus());
        return buildResponse(updated);
    }

    // ===== MOCK CALLBACK (dùng khi demo) =====

    @Override
    @Transactional
    public PaymentResponse handleMockCallback(Long paymentId, String method) {
        log.info("MOCK callback: paymentId={}, method={}", paymentId, method);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.PAYMENT_NOT_FOUND));

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            log.warn("Payment already SUCCESS: {}", paymentId);
            return buildResponse(payment);
        }

        // 1. Update payment
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        payment.setGatewayTransactionId("MOCK_" + method + "_" + System.currentTimeMillis());
        payment.setGatewayResponse("{\"mock\": true, \"method\": \"" + method + "\"}");
        Payment savedPayment = paymentRepository.save(payment);

        // 2. Update booking → PAID
        Booking booking = bookingRepository.findById(payment.getBookingId()).orElse(null);
        if (booking != null && booking.getStatus() == BookingStatus.PENDING) {
            booking.setStatus(BookingStatus.PAID);
            bookingRepository.save(booking);
            log.info("Booking {} updated to PAID", booking.getId());

            // 3. Thông báo cho owner
            try {
                notificationService.createNotification(
                    booking.getOwnerId(),
                    NotificationType.BOOKING_NEW,
                    "Có đơn đặt xe mới",
                    String.format("Đơn #%d đã được thanh toán cọc. Vui lòng xác nhận.", booking.getId()),
                    booking.getId()
                );
            } catch (Exception e) {
                log.warn("Failed to send notification: {}", e.getMessage());
            }
        }

        log.info("Mock callback processed: paymentId={}, status=SUCCESS", paymentId);
        return buildResponse(savedPayment);
    }

    // ===== REFUND =====

    @Override
    @Transactional
    public PaymentResponse refundPayment(Long paymentId, String reason) {
        log.info("Refund payment: id={}, reason={}", paymentId, reason);

        Payment payment = getPaymentEntityById(paymentId);

        if (payment.getStatus() != PaymentStatus.SUCCESS) {
            throw new BadRequestException(ErrorCode.PAYMENT_FAILED);
        }

        Refund refund = Refund.builder()
                .paymentId(paymentId)
                .bookingId(payment.getBookingId())
                .amount(payment.getAmount())
                .reason(reason)
                .status(PaymentStatus.SUCCESS)
                .refundTransactionId("REF_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .processedAt(LocalDateTime.now())
                .build();

        refundRepository.save(refund);

        payment.setStatus(PaymentStatus.REFUNDED);
        Payment updated = paymentRepository.save(payment);

        log.info("Refund processed: refundId={}", refund.getId());
        return buildResponse(updated);
    }

    // ===== HELPER =====

    private PaymentResponse buildResponse(Payment payment) {
        PaymentResponse response = paymentMapper.toResponse(payment);

        User customer = userRepository.findById(payment.getCustomerId()).orElse(null);
        if (customer != null) {
            response.setCustomerName(customer.getName());
        }

        response.setBookingCode("BK-" + payment.getBookingId());

        return response;
    }
}