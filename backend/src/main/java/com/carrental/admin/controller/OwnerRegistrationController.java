package com.carrental.admin.controller;

import com.carrental.admin.dto.OwnerRequestDto;
import com.carrental.admin.dto.OwnerRequestResponse;
import com.carrental.admin.service.OwnerRegistrationService;
import com.carrental.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Controller cho Customer đăng ký làm chủ xe.
 * Base path: /api/v1/owner-register
 */
@RestController
@RequestMapping("/owner-register")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("hasRole('CUSTOMER')")
public class OwnerRegistrationController {

    OwnerRegistrationService ownerRegistrationService;

    /**
     * Customer gửi yêu cầu đăng ký.
     * POST /api/v1/owner-register/submit
     */
    @PostMapping("/submit")
    public ApiResponse<OwnerRequestResponse> submitRequest(
            @RequestAttribute("userId") Long userId,
            @Valid @RequestBody OwnerRequestDto dto) {
        log.info("REST: User {} submitting owner request", userId);
        return ApiResponse.success("Gửi yêu cầu đăng ký thành công",
                ownerRegistrationService.submitRequest(userId, dto));
    }

    /**
     * Customer upload 5 ảnh cho request.
     * POST /api/v1/owner-register/{requestId}/upload
     */
    @PostMapping("/{requestId}/upload")
    public ApiResponse<OwnerRequestResponse> uploadDocuments(
            @PathVariable Long requestId,
            @RequestAttribute("userId") Long userId,
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("types") String[] types) throws IOException {
        log.info("REST: User {} uploading {} docs for request {}",
                userId, files.length, requestId);
        return ApiResponse.success("Upload ảnh thành công",
                ownerRegistrationService.uploadDocuments(requestId, userId, files, types));
    }

    /**
     * Customer xem request mới nhất của mình.
     * GET /api/v1/owner-register/my
     */
    @GetMapping("/my")
    public ApiResponse<OwnerRequestResponse> getMyRequest(
            @RequestAttribute("userId") Long userId) {
        log.info("REST: User {} getting own owner request", userId);
        return ApiResponse.success(ownerRegistrationService.getMyRequest(userId));
    }
}