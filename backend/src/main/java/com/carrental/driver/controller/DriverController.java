package com.carrental.driver.controller;

import com.carrental.common.dto.ApiResponse;
import com.carrental.driver.dto.DriverRequest;
import com.carrental.driver.dto.DriverResponse;
import com.carrental.driver.entity.DriverStatus;
import com.carrental.driver.service.DriverService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

    @PostMapping
    public ApiResponse<DriverResponse> createDriver(
            @RequestAttribute("userId") Long ownerId,
            @Valid @RequestBody DriverRequest request) {
        log.info("REST: Create driver for owner: {}", ownerId);
        return ApiResponse.success("Tạo tài xế thành công",
                driverService.createDriver(ownerId, request));
    }

    @GetMapping("/my")
    public ApiResponse<Page<DriverResponse>> getMyDrivers(
            @RequestAttribute("userId") Long ownerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("REST: Get my drivers: ownerId={}, status={}, search={}, sort={}, page={}, size={}",
                ownerId, status, search, sort, page, size);

        String[] sortParts = sort.split(",");
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("desc")
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = mapSortField(sortParts[0]);

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));

        Page<DriverResponse> drivers = driverService.searchOwnerDrivers(
                ownerId, status, search, pageable);

        return ApiResponse.success(drivers);
    }

    @GetMapping("/{id}")
    public ApiResponse<DriverResponse> getDriverById(@PathVariable Long id) {
        return ApiResponse.success(driverService.getDriverById(id));
    }

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
     * ★ MỚI: Khóa/Mở khóa tài xế.
     * PATCH /api/v1/drivers/{id}/status
     * Body: { "status": "ACTIVE" | "INACTIVE" }
     */
    @PatchMapping("/{id}/status")
    public ApiResponse<DriverResponse> updateStatus(
            @PathVariable Long id,
            @RequestAttribute("userId") Long ownerId,
            @RequestBody UpdateStatusRequest body) {
        log.info("REST: Owner {} update driver {} status to {}", ownerId, id, body.getStatus());
        return ApiResponse.success("Cập nhật trạng thái thành công",
                driverService.updateDriverStatus(id, ownerId, body.getStatus()));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDriver(
            @PathVariable Long id,
            @RequestAttribute("userId") Long ownerId) {
        driverService.deleteDriver(id, ownerId);
        return ApiResponse.success("Xóa tài xế thành công", null);
    }

    // ===== PUBLIC / ADMIN =====

    @GetMapping("/available")
    public ApiResponse<List<DriverResponse>> getAvailableDrivers() {
        return ApiResponse.success(driverService.getAvailableDrivers());
    }

    @PutMapping("/{id}/approve")
    public ApiResponse<DriverResponse> approveDriver(@PathVariable Long id) {
        log.info("REST: Approve driver id: {}", id);
        return ApiResponse.success("Duyệt tài xế thành công",
                driverService.approveDriver(id));
    }

    @PutMapping("/{id}/reject")
    public ApiResponse<DriverResponse> rejectDriver(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        log.info("REST: Reject driver id: {}", id);
        return ApiResponse.success("Từ chối tài xế thành công",
                driverService.rejectDriver(id, reason));
    }

    // ===== HELPER =====

    private String mapSortField(String jpaField) {
        return switch (jpaField) {
            case "createdAt" -> "created_at";
            case "updatedAt" -> "updated_at";
            case "experienceYears" -> "experience_years";
            case "totalTrips" -> "total_trips";
            case "licenseExpiry" -> "license_expiry";
            case "dateOfBirth" -> "date_of_birth";
            case "licenseNumber" -> "license_number";
            default -> jpaField;
        };
    }

    // ===== DTO =====

    @Data
    public static class UpdateStatusRequest {
        @NotBlank(message = "Trạng thái không được để trống")
        private String status;
    }
}