package com.carrental.auth.repository;

import com.carrental.auth.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    /**
     * Tìm OTP mới nhất chưa dùng của SĐT.
     */
    Optional<PasswordResetOtp> findFirstByPhoneAndIsUsedFalseOrderByCreatedAtDesc(String phone);

    /**
     * Tìm OTP theo SĐT + mã OTP chưa dùng.
     */
    Optional<PasswordResetOtp> findByPhoneAndOtpAndIsUsedFalse(String phone, String otp);

    /**
     * Xóa OTP cũ của SĐT (dùng khi tạo OTP mới).
     */
    @Modifying
    @Query("DELETE FROM PasswordResetOtp o WHERE o.phone = :phone")
    void deleteByPhone(@Param("phone") String phone);

    /**
     * Xóa OTP hết hạn.
     */
    @Modifying
    @Query("DELETE FROM PasswordResetOtp o WHERE o.expiresAt < :now")
    void deleteExpired(@Param("now") LocalDateTime now);
}