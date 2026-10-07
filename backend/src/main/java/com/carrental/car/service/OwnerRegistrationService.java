package com.carrental.admin.service;

import com.carrental.admin.dto.OwnerRequestDto;
import com.carrental.admin.dto.OwnerRequestResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface OwnerRegistrationService {

    /**
     * Customer gửi yêu cầu đăng ký làm chủ xe.
     * Validate: user chưa có request PENDING.
     */
    OwnerRequestResponse submitRequest(Long userId, OwnerRequestDto dto);

    /**
     * Upload 5 ảnh cho request.
     * @param requestId ID của request
     * @param userId ID user (để check quyền)
     * @param files mảng 5 file
     * @param types mảng 5 loại: CCCD_FRONT, CCCD_BACK, GPLX_FRONT, GPLX_BACK, SELFIE
     */
    OwnerRequestResponse uploadDocuments(Long requestId, Long userId,
                                          MultipartFile[] files, String[] types) throws IOException;

    /**
     * Customer xem request mới nhất của mình.
     */
    OwnerRequestResponse getMyRequest(Long userId);

    /**
     * Admin list tất cả request theo status.
     */
    List<OwnerRequestResponse> getAllRequests(String status);

    /**
     * Admin xem chi tiết 1 request.
     */
    OwnerRequestResponse getRequestById(Long requestId);

    /**
     * Admin duyệt request → nâng role OWNER.
     */
    OwnerRequestResponse approveRequest(Long requestId, Long adminId);

    /**
     * Admin từ chối request → ghi lý do.
     */
    OwnerRequestResponse rejectRequest(Long requestId, Long adminId, String reason);

    /**
     * Đếm số request PENDING.
     */
    long countPending();
}