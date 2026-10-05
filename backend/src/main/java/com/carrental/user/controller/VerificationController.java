package com.carrental.user.controller;

import com.carrental.common.dto.ApiResponse;
import com.carrental.user.dto.VerificationResponse;
import com.carrental.user.service.VerificationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/verification")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class VerificationController {

    VerificationService verificationService;

    /**
     * Upload 5 ảnh GPLX/CCCD/selfie.
     * POST /api/v1/verification/upload
     * Body: multipart/form-data với key `files` (5 file) + `types` (5 string)
     */
    @PostMapping("/upload")
    public ApiResponse<VerificationResponse> upload(
            @RequestAttribute("userId") Long userId,
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("types") String[] types) throws IOException {

        log.info("REST: User {} uploading {} verification docs", userId, files.length);
        return ApiResponse.success("Upload thành công",
                verificationService.uploadDocuments(userId, files, types));
    }

    /**
     * Gửi hồ sơ cho admin duyệt.
     * POST /api/v1/verification/submit
     */
    @PostMapping("/submit")
    public ApiResponse<VerificationResponse> submit(
            @RequestAttribute("userId") Long userId) {
        log.info("REST: User {} submitting verification", userId);
        return ApiResponse.success("Đã gửi hồ sơ, chờ admin duyệt",
                verificationService.submitForReview(userId));
    }

    /**
     * Xem trạng thái xác thực của mình.
     * GET /api/v1/verification/me
     */
    @GetMapping("/me")
    public ApiResponse<VerificationResponse> getMyVerification(
            @RequestAttribute("userId") Long userId) {
        return ApiResponse.success(verificationService.getMyVerification(userId));
    }
}