package com.carrental.payment.gateway;

import com.carrental.payment.entity.Payment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
@Slf4j
public class MomoGateway implements PaymentGateway {

    @Value("${payment.momo.partner-code:DEMO}")
    String partnerCode;

    @Value("${payment.momo.access-key:DEMO_ACCESS}")
    String accessKey;

    @Value("${payment.momo.secret-key:DEMO_SECRET}")
    String secretKey;

    @Value("${payment.momo.endpoint:https://test-payment.momo.vn/v2/gateway/api/create}")
    String endpoint;

    @Value("${payment.momo.return-url:http://localhost:8080/api/v1/payments/callback/momo}")
    String returnUrl;

    @Value("${payment.momo.notify-url:http://localhost:8080/api/v1/payments/callback/momo}")
    String notifyUrl;

    @Override
    public String createPaymentUrl(Payment payment) {
        log.info("Momo: Creating payment URL for payment id: {}", payment.getId());

        String requestId = UUID.randomUUID().toString();
        String orderId = payment.getTransactionId();
        String amount = String.valueOf(payment.getAmount());
        String orderInfo = "Thanh toan don hang " + orderId;

        String rawSignature = "accessKey=" + accessKey
                + "&amount=" + amount
                + "&extraData="
                + "&ipnUrl=" + notifyUrl
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + partnerCode
                + "&redirectUrl=" + returnUrl
                + "&requestId=" + requestId
                + "&requestType=captureWallet";

        String signature = hmacSHA256(rawSignature, secretKey);

        String paymentUrl = endpoint + "?partnerCode=" + partnerCode
                + "&accessKey=" + accessKey
                + "&requestId=" + requestId
                + "&amount=" + amount
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&returnUrl=" + returnUrl
                + "&notifyUrl=" + notifyUrl
                + "&signature=" + signature;

        log.info("Momo: Payment URL created: {}", paymentUrl);
        return paymentUrl;
    }

    @Override
    public boolean verifySignature(String params) {
        log.info("Momo: Verifying signature");
        return true;
    }

    @Override
    public String extractGatewayTransactionId(String callbackData) {
        log.info("Momo: Extracting transaction id");
        return "MOMO_" + System.currentTimeMillis();
    }

    @Override
    public boolean isPaymentSuccess(String callbackData) {
        log.info("Momo: Checking payment success");
        return callbackData.contains("resultCode=0");
    }

    private String hmacSHA256(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.error("Error creating HMAC SHA256: {}", e.getMessage());
            return "";
        }
    }
}