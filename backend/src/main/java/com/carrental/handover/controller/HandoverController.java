package com.carrental.handover.controller;

import com.carrental.common.dto.ApiResponse;
import com.carrental.common.service.FileStorageService;
import com.carrental.handover.dto.HandoverRequest;
import com.carrental.handover.dto.HandoverResponse;
import com.carrental.handover.service.HandoverService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/handovers")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class HandoverController {

    HandoverService handoverService;
    FileStorageService fileStorageService;

    /**
     * Tạo biên bản giao/nhận xe.
     * POST /api/v1/handovers
     * Chỉ OWNER của booking mới tạo được.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ApiResponse<HandoverResponse> createHandover(
            @RequestAttribute("userId") Long userId,
            @Valid @RequestBody HandoverRequest request) {
        log.info("REST: User {} creating handover for booking {}", userId, request.getBookingId());
        return ApiResponse.success("Tạo biên bản thành công",
                handoverService.createHandover(userId, request));
    }

    /**
     * Chi tiết biên bản.
     * GET /api/v1/handovers/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<HandoverResponse> getHandoverById(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        return ApiResponse.success(handoverService.getHandoverById(id, userId));
    }

    /**
     * Danh sách biên bản theo đơn.
     * GET /api/v1/handovers/booking/{bookingId}
     */
    @GetMapping("/booking/{bookingId}")
    public ApiResponse<List<HandoverResponse>> getHandoversByBooking(
            @PathVariable Long bookingId,
            @RequestAttribute("userId") Long userId) {
        return ApiResponse.success(handoverService.getHandoversByBooking(bookingId, userId));
    }

    /**
     * Ký biên bản.
     * POST /api/v1/handovers/{id}/sign?role=OWNER
     * Body: { "signatureUrl": "/files/signatures/xxx.png" }
     */
    @PostMapping("/{id}/sign")
    public ApiResponse<HandoverResponse> signHandover(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId,
            @RequestParam String role,
            @RequestBody Map<String, String> body) {
        String signatureUrl = body.get("signatureUrl");
        log.info("REST: User {} signing handover {} as {}", userId, id, role);
        return ApiResponse.success("Ký biên bản thành công",
                handoverService.signHandover(id, userId, role, signatureUrl));
    }

    /**
     * Upload ảnh chữ ký.
     * POST /api/v1/handovers/upload-signature
     * Trả về URL ảnh đã upload.
     */
    @PostMapping("/upload-signature")
    public ApiResponse<String> uploadSignature(
            @RequestAttribute("userId") Long userId,
            @RequestParam("file") MultipartFile file) throws IOException {
        log.info("REST: User {} uploading signature", userId);
        String url = fileStorageService.storeFile(file, "signatures/" + userId);
        return ApiResponse.success("Upload chữ ký thành công", url);
    }

    /**
     * Upload ảnh xe.
     * POST /api/v1/handovers/upload-image
     */
    @PostMapping("/upload-image")
    public ApiResponse<String> uploadImage(
            @RequestAttribute("userId") Long userId,
            @RequestParam("file") MultipartFile file) throws IOException {
        log.info("REST: User {} uploading handover image", userId);
        String url = fileStorageService.storeFile(file, "handovers/" + userId);
        return ApiResponse.success("Upload ảnh thành công", url);
    }
}