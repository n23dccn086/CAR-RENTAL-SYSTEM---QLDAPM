package com.carrental.admin.service;

import com.carrental.admin.dto.ApprovalResponse;

import java.util.List;

public interface AdminApprovalService {

    List<ApprovalResponse> getLogsByTarget(String targetType, Long targetId);

    ApprovalResponse logApproval(String targetType, Long targetId,
                                  String action, String reason, Long adminId);

    List<ApprovalResponse> getMyApprovalHistory(Long adminId);
}