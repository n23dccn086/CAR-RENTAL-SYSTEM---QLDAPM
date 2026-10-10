package com.carrental.handover.service;

import com.carrental.handover.dto.HandoverRequest;
import com.carrental.handover.dto.HandoverResponse;

import java.util.List;

public interface HandoverService {

    HandoverResponse createHandover(Long userId, HandoverRequest request);

    HandoverResponse getHandoverById(Long id, Long userId);

    List<HandoverResponse> getHandoversByBooking(Long bookingId, Long userId);

    HandoverResponse signHandover(Long id, Long userId, String role, String signatureUrl);

    // ===== CONTRACT MODULE 6: HANDOVER =====
    java.util.Map<String, Object> createPickupHandover(
            Long userId,
            com.carrental.handover.dto.HandoverPickupRequest request,
            List<org.springframework.web.multipart.MultipartFile> imageFiles);

    java.util.Map<String, Object> createReturnHandover(
            Long userId,
            com.carrental.handover.dto.HandoverReturnRequest request,
            List<org.springframework.web.multipart.MultipartFile> imageFiles);

    void confirmHandover(Long id, Long userId, String signature);
}