package com.carrental.driver.controller;

import com.carrental.common.dto.ApiResponse;
import com.carrental.driver.dto.DriverRequest;
import com.carrental.driver.dto.DriverResponse;
import com.carrental.driver.entity.DriverStatus;
import com.carrental.driver.service.DriverService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/drivers")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class DriverController {

    DriverService driverService;

    // ===== OWNER =====

    /**
     * Tạo tài xế mới.
     * POST /api/v1/drivers
     */
    @PostMapping
    public ApiResponse<DriverResponse> createDriver(
            @RequestAttribute("userId") Long ownerId,
            @Valid @RequestBody DriverRequest request) {
        log.info("REST: Create driver for owner: {}", ownerId);
        return ApiResponse.success("Tạo tài xế thành công",
                driverService.createDriver(ownerId, request));
    }

    /**
     * Lấy danh sách tài xế của tôi.
     * GET /api/v1/drivers/my
     */
    @GetMapping("/my")
    public ApiResponse<List<DriverResponse>> getMyDrivers(
            @RequestAttribute("userId") Long ownerId,
            @RequestParam(required = false) DriverStatus status) {
        if (status != null) {
            return ApiResponse.success(
                    driverService.getMyDriversByStatus(ownerId, status));
        }
        return ApiResponse.success(driverService.getMyDrivers(ownerId));
    }

    /**
     * Lấy chi tiết tài xế.
     * GET /api/v1/drivers/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<DriverResponse> getDriverById(@PathVariable Long id) {
        return ApiResponse.success(driverService.getDriverById(id));
    }

    /**
     * Cập nhật tài xế.
     * PUT /api/v1/drivers/{id}
     */
    @PutMapping("/{id}")
    public ApiResponse<DriverResponse> updateDriver(
            @PathVariable Long id,
            @RequestAttribute("userId") Long ownerId,
            @Valid @RequestBody DriverRequest request) {
        log.info("REST: Update driver id: {} by owner: {}", id, ownerId);
        return ApiResponse.success("Cập nhật tài xế thành công",
                driverService.updateDriver(id, ownerId, request));
    }

    /**
     * Xóa tài xế.
     * DELETE /api/v1/drivers/{id}
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDriver(
            @PathVariable Long id,
            @RequestAttribute("userId") Long ownerId) {
        driverService.deleteDriver(id, ownerId);
        return ApiResponse.success("Xóa tài xế thành công", null);
    }

    // ===== PUBLIC / ADMIN =====

    /**
     * Lấy danh sách tài xế khả dụng.
     * GET /api/v1/drivers/available
     */
    @GetMapping("/available")
    public ApiResponse<List<DriverResponse>> getAvailableDrivers() {
        return ApiResponse.success(driverService.getAvailableDrivers());
    }

    /**
     * Admin duyệt tài xế.
     * PUT /api/v1/drivers/{id}/approve
     */
    @PutMapping("/{id}/approve")
    public ApiResponse<DriverResponse> approveDriver(@PathVariable Long id) {
        log.info("REST: Approve driver id: {}", id);
        return ApiResponse.success("Duyệt tài xế thành công",
                driverService.approveDriver(id));
    }

    /**
     * Admin từ chối tài xế.
     * PUT /api/v1/drivers/{id}/reject
     */
    @PutMapping("/{id}/reject")
    public ApiResponse<DriverResponse> rejectDriver(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        log.info("REST: Reject driver id: {}", id);
        return ApiResponse.success("Từ chối tài xế thành công",
                driverService.rejectDriver(id, reason));
    }
}