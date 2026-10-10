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
     * Contract 6.1: POST /handovers/pickup (multipart/form-data)
     */
    @PostMapping(value = "/pickup", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public ApiResponse<Object> createPickupMultipart(
            @RequestAttribute("userId") Long userId,
            @RequestParam("booking_id") Long bookingId,
            @RequestParam("km_reading") Integer kmReading,
            @RequestParam(value = "fuel_level", required = false) Short fuelLevel,
            @RequestParam(value = "exterior_note", required = false) String exteriorNote,
            @RequestParam(value = "interior_note", required = false) String interiorNote,
            @RequestParam(value = "damages", required = false) String damages,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "signature", required = false) String signature) {
        log.info("REST: User {} creating pickup handover (multipart) for booking {}", userId, bookingId);
        com.carrental.handover.dto.HandoverPickupRequest req = com.carrental.handover.dto.HandoverPickupRequest.builder()
                .bookingId(bookingId)
                .kmReading(kmReading)
                .fuelLevel(fuelLevel)
                .exteriorNote(exteriorNote)
                .interiorNote(interiorNote)
                .damages(damages)
                .signature(signature)
                .build();
        return ApiResponse.success("Biên bản giao xe đã được tạo",
                handoverService.createPickupHandover(userId, req, images));
    }

    /**
     * Contract 6.1: POST /handovers/pickup (application/json)
     */
    @PostMapping(value = "/pickup", consumes = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public ApiResponse<Object> createPickupJson(
            @RequestAttribute("userId") Long userId,
            @Valid @RequestBody com.carrental.handover.dto.HandoverPickupRequest request) {
        log.info("REST: User {} creating pickup handover (json) for booking {}", userId, request.getBookingId());
        return ApiResponse.success("Biên bản giao xe đã được tạo",
                handoverService.createPickupHandover(userId, request, null));
    }

    /**
     * Contract 6.2: POST /handovers/return (multipart/form-data)
     */
    @PostMapping(value = "/return", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public ApiResponse<Object> createReturnMultipart(
            @RequestAttribute("userId") Long userId,
            @RequestParam("booking_id") Long bookingId,
            @RequestParam("km_reading") Integer kmReading,
            @RequestParam(value = "fuel_level", required = false) Short fuelLevel,
            @RequestParam(value = "exterior_note", required = false) String exteriorNote,
            @RequestParam(value = "interior_note", required = false) String interiorNote,
            @RequestParam(value = "damages", required = false) String damages,
            @RequestParam(value = "extra_fees", required = false) java.math.BigDecimal extraFees,
            @RequestParam(value = "extra_fees_note", required = false) String extraFeesNote,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @RequestParam(value = "signature", required = false) String signature) {
        log.info("REST: User {} creating return handover (multipart) for booking {}", userId, bookingId);
        com.carrental.handover.dto.HandoverReturnRequest req = com.carrental.handover.dto.HandoverReturnRequest.builder()
                .bookingId(bookingId)
                .kmReading(kmReading)
                .fuelLevel(fuelLevel)
                .exteriorNote(exteriorNote)
                .interiorNote(interiorNote)
                .damages(damages)
                .extraFees(extraFees)
                .extraFeesNote(extraFeesNote)
                .signature(signature)
                .build();
        return ApiResponse.success("Biên bản hoàn tất, tính phụ phí phát sinh",
                handoverService.createReturnHandover(userId, req, images));
    }

    /**
     * Contract 6.2: POST /handovers/return (application/json)
     */
    @PostMapping(value = "/return", consumes = org.springframework.http.MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public ApiResponse<Object> createReturnJson(
            @RequestAttribute("userId") Long userId,
            @Valid @RequestBody com.carrental.handover.dto.HandoverReturnRequest request) {
        log.info("REST: User {} creating return handover (json) for booking {}", userId, request.getBookingId());
        return ApiResponse.success("Biên bản hoàn tất, tính phụ phí phát sinh",
                handoverService.createReturnHandover(userId, request, null));
    }

    /**
     * Contract 6.3: POST /handovers/:id/confirm
     */
    @PostMapping("/{id}/confirm")
    public ApiResponse<Object> confirmHandover(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId,
            @RequestBody(required = false) Map<String, String> body) {
        String signature = null;
        if (body != null) {
            signature = body.get("signature") != null ? body.get("signature") : body.get("signatureUrl");
        }
        log.info("REST: User {} confirming handover {}", userId, id);
        handoverService.confirmHandover(id, userId, signature);
        return ApiResponse.success("Đã xác nhận biên bản");
    }

    /**
     * Tạo biên bản giao/nhận xe (Legacy frontend compatibility).
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