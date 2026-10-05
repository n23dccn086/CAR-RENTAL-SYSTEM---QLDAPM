package com.carrental.user.service;

import com.carrental.user.dto.VerificationResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface VerificationService {

    /** User upload 5 ảnh (GPLX 2 mặt, CCCD 2 mặt, selfie) */
    VerificationResponse uploadDocuments(Long userId, MultipartFile[] files, String[] types) throws IOException;

    /** User xác nhận gửi hồ sơ cho admin duyệt */
    VerificationResponse submitForReview(Long userId);

    /** User xem trạng thái xác thực của mình */
    VerificationResponse getMyVerification(Long userId);

    /** Admin duyệt → VERIFIED */
    VerificationResponse approve(Long userId, Long adminId);

    /** Admin từ chối → REJECTED */
    VerificationResponse reject(Long userId, Long adminId, String reason);
}