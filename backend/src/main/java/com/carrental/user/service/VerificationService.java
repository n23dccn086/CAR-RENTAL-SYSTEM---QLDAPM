package com.carrental.user.service;

import com.carrental.user.dto.SubmitVerificationRequest;
import com.carrental.user.dto.VerificationResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

public interface VerificationService {

    /** 2.2 Upload GPLX (mặt trước, mặt sau, số GPLX, hạng GPLX) */
    Map<String, Object> uploadGplx(Long userId, MultipartFile gplxFront, MultipartFile gplxBack, String gplxNumber, String gplxClass) throws IOException;

    /** 2.3 Upload CCCD (mặt trước, mặt sau, số CCCD) */
    Map<String, Object> uploadCccd(Long userId, MultipartFile cccdFront, MultipartFile cccdBack, String cccdNumber) throws IOException;

    /** 2.4 Upload Selfie */
    Map<String, Object> uploadSelfie(Long userId, MultipartFile selfie) throws IOException;

    /** 2.5 Gửi hồ sơ xác thực */
    Map<String, Object> submitVerification(Long userId, SubmitVerificationRequest request);

    /** User upload 5 ảnh (GPLX 2 mặt, CCCD 2 mặt, selfie) - Legacy frontend */
    VerificationResponse uploadDocuments(Long userId, MultipartFile[] files, String[] types) throws IOException;

    /** User xác nhận gửi hồ sơ cho admin duyệt - Legacy frontend */
    VerificationResponse submitForReview(Long userId);

    /** User xem trạng thái xác thực của mình */
    VerificationResponse getMyVerification(Long userId);

    /** Admin duyệt → VERIFIED */
    VerificationResponse approve(Long userId, Long adminId);

    /** Admin từ chối → REJECTED */
    VerificationResponse reject(Long userId, Long adminId, String reason);
}