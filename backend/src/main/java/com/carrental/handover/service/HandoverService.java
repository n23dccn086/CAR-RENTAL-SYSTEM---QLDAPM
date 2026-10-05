package com.carrental.handover.service;

import com.carrental.handover.dto.HandoverRequest;
import com.carrental.handover.dto.HandoverResponse;

import java.util.List;

public interface HandoverService {

    HandoverResponse createHandover(Long userId, HandoverRequest request);

    HandoverResponse getHandoverById(Long id, Long userId);

    List<HandoverResponse> getHandoversByBooking(Long bookingId, Long userId);

    HandoverResponse signHandover(Long id, Long userId, String role, String signatureUrl);
}