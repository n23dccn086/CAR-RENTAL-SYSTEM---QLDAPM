package com.carrental.handover.controller;

import com.carrental.common.dto.ApiResponse;
import com.carrental.handover.dto.HandoverRequest;
import com.carrental.handover.dto.HandoverResponse;
import com.carrental.handover.service.HandoverService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/handovers")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class HandoverController {

    HandoverService handoverService;

    /**
     * Tạo biên bản giao/nhận xe.
     * POST /api/v1/handovers
     */
    @PostMapping
    public ApiResponse<HandoverResponse> createHandover(
            @Valid @RequestBody HandoverRequest request) {
        log.info("REST: Create handover for booking: {}", request.getBookingId());
        return ApiResponse.success("Tạo biên bản thành công",
                handoverService.createHandover(request));
    }

    /**
     * Chi tiết biên bản.
     * GET /api/v1/handovers/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<HandoverResponse> getHandoverById(@PathVariable Long id) {
        return ApiResponse.success(handoverService.getHandoverById(id));
    }

    /**
     * Danh sách biên bản theo đơn.
     * GET /api/v1/handovers/booking/{bookingId}
     */
    @GetMapping("/booking/{bookingId}")
    public ApiResponse<List<HandoverResponse>> getHandoversByBooking(
            @PathVariable Long bookingId) {
        return ApiResponse.success(handoverService.getHandoversByBooking(bookingId));
    }

    /**
     * Ký biên bản.
     * POST /api/v1/handovers/{id}/sign?role=OWNER
     */
    @PostMapping("/{id}/sign")
    public ApiResponse<HandoverResponse> signHandover(
            @PathVariable Long id,
            @RequestParam String role,
            @RequestParam String signature) {
        log.info("REST: Sign handover {} by role: {}", id, role);
        return ApiResponse.success("Ký biên bản thành công",
                handoverService.signHandover(id, role, signature));
    }

    /**
     * Upload ảnh biên bản.
     * POST /api/v1/handovers/{id}/images
     */
    @PostMapping("/{id}/images")
    public ApiResponse<List<HandoverResponse.ImageResponse>> addImages(
            @PathVariable Long id,
            @Valid @RequestBody List<HandoverRequest.HandoverImageRequest> images) {
        log.info("REST: Add {} images to handover {}", images.size(), id);
        return ApiResponse.success("Thêm ảnh thành công",
                handoverService.addImages(id, images));
    }
}