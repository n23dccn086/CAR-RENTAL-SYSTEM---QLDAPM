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
        if (params == null || params.isBlank()) {
            return false;
        }
        // Chế độ demo (chưa cấu hình secret thật): KHÔNG nhận callback từ bên ngoài,
        // vì không có cách nào kiểm chứng. Demo đi qua POST /payments/{id}/mock-success (cần JWT).
        if (secretKey == null || secretKey.isBlank() || "DEMO_SECRET".equals(secretKey)) {
            log.warn("Momo: callback rejected — gateway is running with DEMO credentials");
            return false;
        }
        String received = extractField(params, "signature");
        if (received == null) {
            return false;
        }
        // Chuỗi ký IPN theo tài liệu MoMo v2 (các trường sắp xếp theo alphabet)
        String raw = "accessKey=" + accessKey
                + "&amount=" + nvl(extractField(params, "amount"))
                + "&extraData=" + nvl(extractField(params, "extraData"))
                + "&message=" + nvl(extractField(params, "message"))
                + "&orderId=" + nvl(extractField(params, "orderId"))
                + "&orderInfo=" + nvl(extractField(params, "orderInfo"))
                + "&orderType=" + nvl(extractField(params, "orderType"))
                + "&partnerCode=" + nvl(extractField(params, "partnerCode"))
                + "&payType=" + nvl(extractField(params, "payType"))
                + "&requestId=" + nvl(extractField(params, "requestId"))
                + "&responseTime=" + nvl(extractField(params, "responseTime"))
                + "&resultCode=" + nvl(extractField(params, "resultCode"))
                + "&transId=" + nvl(extractField(params, "transId"));
        String expected = hmacSHA256(raw, secretKey);
        return java.security.MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                received.getBytes(StandardCharsets.UTF_8));
    }

    private static String nvl(String s) {
        return s == null ? "" : s;
    }

    /** Lấy giá trị 1 trường từ payload JSON ({"k": "v"} hoặc {"k": 123}) hoặc form-urlencoded (k=v&...). */
    private static String extractField(String payload, String key) {
        String k = java.util.regex.Pattern.quote(key);
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("\"" + k + "\"\\s*:\\s*(?:\"((?:[^\"\\\\]|\\\\.)*)\"|(-?[0-9]+))")
                .matcher(payload);
        if (m.find()) {
            return m.group(1) != null ? m.group(1) : m.group(2);
        }
        m = java.util.regex.Pattern.compile("(?:^|[?&])" + k + "=([^&]*)").matcher(payload);
        if (m.find()) {
            return java.net.URLDecoder.decode(m.group(1), StandardCharsets.UTF_8);
        }
        return null;
    }

    @Override
    public String extractGatewayTransactionId(String callbackData) {
        log.info("Momo: Extracting transaction id");
        if (callbackData != null) {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("\"transId\"\\s*:\\s*([0-9]+)").matcher(callbackData);
            if (m.find()) return m.group(1);
            java.util.regex.Matcher m2 = java.util.regex.Pattern.compile("(?:^|[?&])transId=([^&]+)").matcher(callbackData);
            if (m2.find()) return m2.group(1);
        }
        return "MOMO_" + System.currentTimeMillis();
    }

    @Override
    public boolean isPaymentSuccess(String callbackData) {
        log.info("Momo: Checking payment success");
        if (callbackData == null) return false;
        return callbackData.contains("resultCode=0")
                || callbackData.matches("(?s).*\"resultCode\"\\s*:\\s*0.*");
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