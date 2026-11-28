package com.carrental.payment.gateway;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Callback MoMo là endpoint public → chữ ký HMAC phải được kiểm tra thật,
 * nếu không bất kỳ ai cũng có thể POST "resultCode=0" để đánh dấu đơn đã thanh toán.
 */
class MomoGatewaySignatureTest {

    private static final String ACCESS = "ACCESS_TEST";
    private static final String SECRET = "SECRET_TEST";

    private MomoGateway gateway;

    @BeforeEach
    void setUp() {
        gateway = new MomoGateway();
        ReflectionTestUtils.setField(gateway, "accessKey", ACCESS);
        ReflectionTestUtils.setField(gateway, "secretKey", SECRET);
        ReflectionTestUtils.setField(gateway, "partnerCode", "MOMOTEST");
    }

    private static String hmac(String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        StringBuilder sb = new StringBuilder();
        for (byte b : mac.doFinal(data.getBytes(StandardCharsets.UTF_8))) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    private static String raw(String resultCode) {
        return "accessKey=" + ACCESS + "&amount=600000&extraData=&message=Successful.&orderId=TXN_1"
                + "&orderInfo=Thanh toan&orderType=momo_wallet&partnerCode=MOMOTEST&payType=qr"
                + "&requestId=req-1&responseTime=1732780000000&resultCode=" + resultCode + "&transId=4088878653";
    }

    private static String json(String resultCode, String signature) {
        return "{\"partnerCode\":\"MOMOTEST\",\"orderId\":\"TXN_1\",\"requestId\":\"req-1\",\"amount\":600000,"
                + "\"orderInfo\":\"Thanh toan\",\"orderType\":\"momo_wallet\",\"transId\":4088878653,"
                + "\"resultCode\":" + resultCode + ",\"message\":\"Successful.\",\"payType\":\"qr\","
                + "\"responseTime\":1732780000000,\"extraData\":\"\",\"signature\":\"" + signature + "\"}";
    }

    @Test
    @DisplayName("Chữ ký đúng → chấp nhận")
    void validSignatureAccepted() throws Exception {
        assertTrue(gateway.verifySignature(json("0", hmac(raw("0")))));
    }

    @Test
    @DisplayName("Sửa resultCode nhưng giữ chữ ký cũ → từ chối")
    void tamperedPayloadRejected() throws Exception {
        assertFalse(gateway.verifySignature(json("0", hmac(raw("1006")))));
    }

    @Test
    @DisplayName("Không có chữ ký → từ chối")
    void missingSignatureRejected() {
        assertFalse(gateway.verifySignature("resultCode=0&orderId=TXN_1"));
    }

    @Test
    @DisplayName("Chạy với secret DEMO → không nhận callback bên ngoài")
    void demoCredentialsRejectCallbacks() throws Exception {
        ReflectionTestUtils.setField(gateway, "secretKey", "DEMO_SECRET");
        assertFalse(gateway.verifySignature(json("0", hmac(raw("0")))));
    }
}
