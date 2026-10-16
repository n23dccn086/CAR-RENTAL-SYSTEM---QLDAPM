package com.carrental.admin.controller;

import com.carrental.common.dto.ApiResponse;
import com.carrental.driver.dto.DriverResponse;
import com.carrental.driver.entity.DriverStatus;
import com.carrental.driver.service.DriverService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller cho ADMIN duyệt tài xế.
 * Base path: /api/v1/admin/drivers
 */
@RestController
@RequestMapping("/admin/drivers")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminDriverController {

    DriverService driverService;

    /**
     * Lấy danh sách tài xế với filter status.
     * GET /api/v1/admin/drivers?status=PENDING&page=0&size=10
     */
    @GetMapping
    public ApiResponse<Page<DriverResponse>> getAllDrivers(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        log.info("REST: Admin get drivers, status={}, page={}, size={}", status, page, size);

        String[] sortParts = sort.split(",");
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("desc")
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = mapSortField(sortParts[0]);

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));

        Page<DriverResponse> drivers;
        if (status != null && !status.isBlank()) {
            DriverStatus driverStatus = DriverStatus.valueOf(status.toUpperCase());
            drivers = driverService.getDriversByStatusPaged(driverStatus, pageable);
        } else {
            drivers = driverService.getAllDriversPaged(pageable);
        }

        return ApiResponse.success(drivers);
    }

    /**
     * Đếm số tài xế theo status.
     * GET /api/v1/admin/drivers/count?status=PENDING
     */
    @GetMapping("/count")
    public ApiResponse<Long> countByStatus(@RequestParam String status) {
        DriverStatus driverStatus = DriverStatus.valueOf(status.toUpperCase());
        long count = driverService.countByStatus(driverStatus);
        return ApiResponse.success(count);
    }

    /**
     * Duyệt tài xế.
     * PUT /api/v1/admin/drivers/{id}/approve
     */
    @PutMapping("/{id}/approve")
    public ApiResponse<DriverResponse> approveDriver(@PathVariable Long id) {
        log.info("REST: Admin approve driver id: {}", id);
        return ApiResponse.success("Duyệt tài xế thành công",
                driverService.approveDriver(id));
    }

    /**
     * Từ chối tài xế.
     * PUT /api/v1/admin/drivers/{id}/reject?reason=...
     */
    @PutMapping("/{id}/reject")
    public ApiResponse<DriverResponse> rejectDriver(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        log.info("REST: Admin reject driver id: {}, reason: {}", id, reason);
        return ApiResponse.success("Từ chối tài xế thành công",
                driverService.rejectDriver(id, reason));
    }

    /**
     * Khóa tài xế.
     * PUT /api/v1/admin/drivers/{id}/lock
     */
    @PutMapping("/{id}/lock")
    public ApiResponse<DriverResponse> lockDriver(@PathVariable Long id) {
        log.info("REST: Admin lock driver id: {}", id);
        return ApiResponse.success("Đã khóa tài xế",
                driverService.adminUpdateDriverStatus(id, "INACTIVE"));
    }

    /**
     * Mở khóa tài xế.
     * PUT /api/v1/admin/drivers/{id}/unlock
     */
    @PutMapping("/{id}/unlock")
    public ApiResponse<DriverResponse> unlockDriver(@PathVariable Long id) {
        log.info("REST: Admin unlock driver id: {}", id);
        return ApiResponse.success("Đã mở khóa tài xế",
                driverService.adminUpdateDriverStatus(id, "ACTIVE"));
    }

    /**
     * Cập nhật trạng thái tài xế.
     * PATCH /api/v1/admin/drivers/{id}/status
     */
    @PatchMapping("/{id}/status")
    public ApiResponse<DriverResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        String status = body.get("status");
        log.info("REST: Admin update driver {} status: {}", id, status);
        return ApiResponse.success("Cập nhật trạng thái thành công",
                driverService.adminUpdateDriverStatus(id, status));
    }

    private String mapSortField(String jpaField) {
        return switch (jpaField) {
            case "createdAt" -> "createdAt";
            case "updatedAt" -> "updatedAt";
            case "experienceYears" -> "experienceYears";
            case "totalTrips" -> "totalTrips";
            case "licenseExpiry" -> "licenseExpiry";
            case "dateOfBirth" -> "dateOfBirth";
            case "licenseNumber" -> "licenseNumber";
            case "rating" -> "rating";
            case "name" -> "name";
            default -> "createdAt";
        };
    }
}