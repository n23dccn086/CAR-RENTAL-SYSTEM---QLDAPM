package com.carrental.auth.service;

import com.carrental.auth.entity.PasswordResetOtp;
import com.carrental.auth.repository.PasswordResetOtpRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.notification.service.NotificationSender;
import com.carrental.user.entity.User;
import com.carrental.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class OtpServiceImpl implements OtpService {

    UserRepository userRepository;
    PasswordResetOtpRepository otpRepository;
    NotificationSender notificationSender;
    PasswordEncoder passwordEncoder;

    /** OTP hết hạn sau 5 phút */
    static final int OTP_EXPIRES_MINUTES = 5;

    /** Số lần nhập sai tối đa */
    static final int MAX_ATTEMPTS = 5;

    /** Rate limit: 1 OTP / 60s / SĐT */
    static final int RESEND_COOLDOWN_SECONDS = 60;

    private static final SecureRandom RANDOM = new SecureRandom();

    // ============================================================
    // SEND OTP
    // ============================================================

    @Override
    @Transactional
    public void sendOtp(String phone) {
        log.info("Send OTP to phone: {}", phone);

        // 1. Check user tồn tại
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        if (user.getDeletedAt() != null) {
            throw new BadRequestException(ErrorCode.ACCOUNT_DISABLED);
        }

        // 2. Rate limit: check OTP mới nhất có trong vòng 60s không
        otpRepository.findFirstByPhoneAndIsUsedFalseOrderByCreatedAtDesc(phone)
                .ifPresent(lastOtp -> {
                    LocalDateTime createdAt = lastOtp.getCreatedAt();
                    if (createdAt != null && createdAt.plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
                        throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                                "Vui lòng chờ 60 giây trước khi gửi lại OTP");
                    }
                });

        // 3. Xóa OTP cũ của SĐT
        otpRepository.deleteByPhone(phone);

        // 4. Tạo OTP 6 số
        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(OTP_EXPIRES_MINUTES);

        PasswordResetOtp entity = PasswordResetOtp.builder()
                .phone(phone)
                .otp(otp)
                .expiresAt(expiresAt)
                .isUsed(false)
                .attempts(0)
                .build();
        otpRepository.save(entity);

        // 5. Gửi SMS (Mock — in ra console)
        String message = String.format(
                "[MAISON] Ma OTP dat lai mat khau cua ban la: %s. " +
                "Ma co hieu luc trong %d phut. Khong chia se ma nay voi bat ky ai.",
                otp, OTP_EXPIRES_MINUTES
        );
        notificationSender.send(phone, message);

        log.info("OTP sent to {}: {}", phone, otp);
    }

    // ============================================================
    // VERIFY + RESET PASSWORD
    // ============================================================

    @Override
    @Transactional
    public void verifyAndResetPassword(String phone, String otp, String newPassword) {
        log.info("Verify OTP and reset password for phone: {}", phone);

        // 1. Tìm OTP
        PasswordResetOtp entity = otpRepository
                .findByPhoneAndOtpAndIsUsedFalse(phone, otp)
                .orElseThrow(() -> new BadRequestException(ErrorCode.VALIDATION_ERROR,
                        "Mã OTP không đúng"));

        // 2. Check hết hạn
        if (entity.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        // 3. Check số lần nhập sai
        if (entity.getAttempts() >= MAX_ATTEMPTS) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.");
        }

        // 4. Tìm user
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        // 5. Update password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // 6. Đánh dấu OTP đã dùng
        entity.setIsUsed(true);
        otpRepository.save(entity);

        log.info("Password reset successfully for phone: {}", phone);
    }
}