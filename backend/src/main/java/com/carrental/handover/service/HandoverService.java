package com.carrental.handover.service;

import com.carrental.handover.dto.HandoverRequest;
import com.carrental.handover.dto.HandoverResponse;

import java.util.List;

public interface HandoverService {

    HandoverResponse createHandover(HandoverRequest request);

    HandoverResponse getHandoverById(Long id);

    List<HandoverResponse> getHandoversByBooking(Long bookingId);

    HandoverResponse signHandover(Long id, String role, String signature);

    List<HandoverResponse.ImageResponse> addImages(Long handoverId,
                                                    List<HandoverRequest.HandoverImageRequest> images);
}