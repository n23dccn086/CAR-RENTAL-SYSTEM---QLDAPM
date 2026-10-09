package com.carrental.auth.service;

public interface OtpService {

    /**
     * Tạo OTP cho SĐT và gửi SMS (mock).
     */
    void sendOtp(String phone);

    /**
     * Verify OTP và reset mật khẩu.
     */
    void verifyAndResetPassword(String phone, String otp, String newPassword);
}