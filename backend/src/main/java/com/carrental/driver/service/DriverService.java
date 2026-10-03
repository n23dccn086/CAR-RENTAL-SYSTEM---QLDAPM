package com.carrental.driver.service;

import com.carrental.driver.dto.DriverRequest;
import com.carrental.driver.dto.DriverResponse;
import com.carrental.driver.entity.DriverStatus;

import java.util.List;

/**
 * Service xử lý nghiệp vụ tài xế.
 */
public interface DriverService {

    // ===== OWNER =====

    /** Tạo tài xế mới */
    DriverResponse createDriver(Long ownerId, DriverRequest request);

    /** Lấy danh sách tài xế của tôi */
    List<DriverResponse> getMyDrivers(Long ownerId);

    /** Lấy tài xế theo status của tôi */
    List<DriverResponse> getMyDriversByStatus(Long ownerId, DriverStatus status);

    /** Lấy chi tiết tài xế */
    DriverResponse getDriverById(Long id);

    /** Cập nhật tài xế */
    DriverResponse updateDriver(Long id, Long ownerId, DriverRequest request);

    /** Xóa tài xế (soft delete) */
    void deleteDriver(Long id, Long ownerId);

    // ===== PUBLIC / ADMIN =====

    /** Lấy danh sách tài xế khả dụng */
    List<DriverResponse> getAvailableDrivers();

    /** Admin duyệt tài xế */
    DriverResponse approveDriver(Long id);

    /** Admin từ chối tài xế */
    DriverResponse rejectDriver(Long id, String reason);
}