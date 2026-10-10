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
    com.carrental.driver.service.DriverAssignmentService assignmentService;

    // ===== OWNER =====

    /**
     * Contract 7.1: POST /drivers
     */
    @PostMapping
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public ApiResponse<DriverResponse> createDriver(
            @RequestAttribute("userId") Long ownerId,
            @Valid @RequestBody DriverRequest request) {
        log.info("REST: Create driver for owner: {}", ownerId);
        return ApiResponse.success("Tài xế đã được tạo, chờ Admin duyệt",
                driverService.createDriver(ownerId, request));
    }

    /**
     * Contract 7.2: GET /drivers/my?status=available&page=1&limit=20
     */
    @GetMapping("/my")
    public ApiResponse<Object> getMyDrivers(
            @RequestAttribute("userId") Long ownerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            @RequestParam(defaultValue = "10") int size) {

        int pageNum = page != null ? (page > 0 ? page - 1 : 0) : 0;
        int pageSize = limit != null ? limit : size;

        log.info("REST: Get my drivers: ownerId={}, status={}, search={}, sort={}, page={}, size={}",
                ownerId, status, search, sort, pageNum, pageSize);

        String[] sortParts = sort.split(",");
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("desc")
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = mapSortField(sortParts[0]);

        Pageable pageable = PageRequest.of(pageNum, pageSize, Sort.by(direction, sortField));

        Page<DriverResponse> drivers = driverService.searchOwnerDrivers(
                ownerId, status, search, pageable);

        java.util.Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("drivers", drivers.getContent());
        data.put("content", drivers.getContent());
        data.put("totalElements", drivers.getTotalElements());
        data.put("totalPages", drivers.getTotalPages());
        data.put("number", drivers.getNumber());
        data.put("size", drivers.getSize());

        java.util.Map<String, Object> pagination = new java.util.LinkedHashMap<>();
        pagination.put("page", drivers.getNumber() + 1);
        pagination.put("limit", drivers.getSize());
        pagination.put("total", drivers.getTotalElements());
        pagination.put("total_pages", drivers.getTotalPages());
        data.put("pagination", pagination);

        return ApiResponse.success(data);
    }

    /**
     * Contract 7.3: POST /drivers/assign
     */
    @PostMapping("/assign")
    public ApiResponse<Object> assignDriver(
            @RequestAttribute("userId") Long ownerId,
            @jakarta.validation.Valid @RequestBody com.carrental.driver.dto.DriverAssignRequest request) {
        log.info("REST: Owner {} assign driver: {}", ownerId, request);
        com.carrental.driver.entity.DriverAssignment assignment = assignmentService.manualAssignDriver(
                ownerId, request.getDriverId(), request.getBookingId(), request.getCarId());

        java.util.Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("assignment_id", assignment.getId());
        data.put("driver_id", assignment.getDriverId());
        data.put("booking_id", assignment.getBookingId());
        data.put("status", "assigned");
        return ApiResponse.success("Đã gán tài xế vào chuyến", data);
    }

    /**
     * Contract 7.4: POST /drivers/assignments/:id/accept
     */
    @PostMapping("/assignments/{id}/accept")
    public ApiResponse<Object> acceptAssignment(
            @PathVariable Long id,
            @RequestAttribute(value = "userId", required = false) Long driverUserId,
            @RequestParam(value = "token", required = false) String token) {
        log.info("REST: Driver accept assignment: id={}, user={}, token={}", id, driverUserId, token);
        assignmentService.acceptAssignmentByDriver(id, driverUserId, token);
        return ApiResponse.success("Tài xế đã nhận chuyến", java.util.Map.of("status", "accepted"));
    }

    /**
     * Contract 7.5: POST /drivers/assignments/:id/reject
     */
    @PostMapping("/assignments/{id}/reject")
    public ApiResponse<Object> rejectAssignment(
            @PathVariable Long id,
            @RequestAttribute(value = "userId", required = false) Long driverUserId,
            @RequestParam(value = "token", required = false) String token,
            @RequestParam(value = "reason", required = false) String queryReason,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String reason = queryReason;
        if (reason == null && body != null && body.containsKey("reason")) {
            reason = body.get("reason");
        }
        log.info("REST: Driver reject assignment: id={}, user={}, reason={}", id, driverUserId, reason);
        assignmentService.rejectAssignmentByDriver(id, driverUserId, token, reason);
        return ApiResponse.success("Tài xế đã từ chối chuyến", java.util.Map.of("status", "rejected"));
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