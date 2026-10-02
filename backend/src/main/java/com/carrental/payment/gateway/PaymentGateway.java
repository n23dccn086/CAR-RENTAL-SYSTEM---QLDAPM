package com.carrental.payment.gateway;

import com.carrental.payment.entity.Payment;

/**
 * Interface chung cho tất cả cổng thanh toán.
 * Mỗi cổng (Momo, VNPAY, ZaloPay) sẽ implement interface này.
 */
public interface PaymentGateway {

    /**
     * Tạo URL thanh toán để redirect khách hàng đến cổng.
     */
    String createPaymentUrl(Payment payment);

    /**
     * Xác thực chữ ký số trong callback từ cổng thanh toán.
     */
    boolean verifySignature(String params);

    /**
     * Lấy mã giao dịch từ cổng thanh toán.
     */
    String extractGatewayTransactionId(String callbackData);

    /**
     * Kiểm tra callback có phải thanh toán thành công.
     */
    boolean isPaymentSuccess(String callbackData);
}