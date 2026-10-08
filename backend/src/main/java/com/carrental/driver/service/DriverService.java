package com.carrental.driver.service;

import com.carrental.driver.dto.DriverRequest;
import com.carrental.driver.dto.DriverResponse;
import com.carrental.driver.entity.DriverStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface DriverService {

    // ===== OWNER =====

    DriverResponse createDriver(Long ownerId, DriverRequest request);

    List<DriverResponse> getMyDrivers(Long ownerId);

    List<DriverResponse> getMyDriversByStatus(Long ownerId, DriverStatus status);

    DriverResponse getDriverById(Long id);

    DriverResponse updateDriver(Long id, Long ownerId, DriverRequest request);

    void deleteDriver(Long id, Long ownerId);

    // ★ MỚI: Khóa/mở khóa tài xế
    DriverResponse updateDriverStatus(Long id, Long ownerId, String newStatus);

    // ===== SEARCH + PHÂN TRANG =====
    Page<DriverResponse> searchOwnerDrivers(
            Long ownerId,
            String status,
            String search,
            Pageable pageable);

    // ===== PUBLIC / ADMIN =====

    List<DriverResponse> getAvailableDrivers();

    DriverResponse approveDriver(Long id);

    DriverResponse rejectDriver(Long id, String reason);

    // ===== ADMIN =====

    List<DriverResponse> getAllDrivers();

    List<DriverResponse> getDriversByStatus(DriverStatus status);

    long countPendingDrivers();
}