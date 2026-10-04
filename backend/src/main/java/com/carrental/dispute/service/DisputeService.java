package com.carrental.dispute.service;

import com.carrental.admin.dto.DisputeResponse;
import com.carrental.dispute.dto.DisputeRequest;

import java.util.List;

public interface DisputeService {

    /** User tạo tranh chấp */
    DisputeResponse createDispute(Long userId, DisputeRequest request);

    /** User xem danh sách tranh chấp của mình */
    List<DisputeResponse> getMyDisputes(Long userId);

    /** User xem chi tiết tranh chấp */
    DisputeResponse getMyDisputeById(Long id, Long userId);
}