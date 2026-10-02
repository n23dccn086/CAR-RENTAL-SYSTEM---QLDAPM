package com.carrental.car.controller;

import com.carrental.car.dto.CarRequest;
import com.carrental.car.dto.CarResponse;
import com.carrental.car.entity.CarStatus;
import com.carrental.car.entity.CarType;
import com.carrental.car.service.CarService;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.dto.ApiResponse;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.common.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cars")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CarController {

    CarService carService;
    JwtService jwtService;

    // ===== PUBLIC ENDPOINTS =====

    /**
     * Lấy danh sách tất cả xe (public)
     * GET /api/v1/cars
     */
    @GetMapping
    public ApiResponse<List<CarResponse>> getAllCars() {
        log.info("REST request to get all cars");
        return ApiResponse.success(carService.getAllCars());
    }

    /**
     * Lấy chi tiết xe theo ID (public)
     * GET /api/v1/cars/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<CarResponse> getCarById(@PathVariable Long id) {
        log.info("REST request to get car: {}", id);
        return ApiResponse.success(carService.getCarById(id));
    }

    /**
     * Lấy xe available (public)
     * GET /api/v1/cars/available
     */
    @GetMapping("/available")
    public ApiResponse<List<CarResponse>> getAvailableCars() {
        log.info("REST request to get available cars");
        return ApiResponse.success(carService.getAvailableCars());
    }

    /**
     * Tìm kiếm xe theo status + type (public)
     * GET /api/v1/cars/search?status=AVAILABLE&type=SUV
     */
    @GetMapping("/search")
    public ApiResponse<List<CarResponse>> searchCars(
            @RequestParam(required = false) CarStatus status,
            @RequestParam(required = false) CarType type) {
        log.info("REST request to search cars: status={}, type={}", status, type);
        return ApiResponse.success(carService.searchCars(status, type));
    }

    // ===== PROTECTED ENDPOINTS (cần JWT) =====

    /**
     * Tạo xe mới (cần JWT - chủ xe)
     * POST /api/v1/cars
     */
    @PostMapping
    public ApiResponse<CarResponse> createCar(
            @Valid @RequestBody CarRequest request,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to create car: ownerId={}, plate={}", ownerId, request.getPlate());

        CarResponse response = carService.createCar(ownerId, request);
        return ApiResponse.success("Tạo xe thành công. Vui lòng chờ Admin duyệt.", response);
    }

    /**
     * Cập nhật xe (cần JWT - chủ xe)
     * PUT /api/v1/cars/{id}
     */
    @PutMapping("/{id}")
    public ApiResponse<CarResponse> updateCar(
            @PathVariable Long id,
            @Valid @RequestBody CarRequest request,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to update car: id={}, ownerId={}", id, ownerId);

        CarResponse response = carService.updateCar(id, ownerId, request);
        return ApiResponse.success("Cập nhật xe thành công", response);
    }

    /**
     * Xóa xe - soft delete (cần JWT - chủ xe)
     * DELETE /api/v1/cars/{id}
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCar(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to delete car: id={}, ownerId={}", id, ownerId);

        carService.deleteCar(id, ownerId);
        return ApiResponse.success("Xóa xe thành công", null);
    }

    /**
     * Lấy xe của tôi (cần JWT)
     * GET /api/v1/cars/my
     */
    @GetMapping("/my")
    public ApiResponse<List<CarResponse>> getMyCars(HttpServletRequest httpRequest) {
        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to get my cars: ownerId={}", ownerId);

        return ApiResponse.success(carService.getCarsByOwner(ownerId));
    }

    // ===== ADMIN ENDPOINTS =====

    /**
     * Admin duyệt xe
     * PUT /api/v1/cars/{id}/approve
     */
    @PutMapping("/{id}/approve")
    public ApiResponse<CarResponse> approveCar(@PathVariable Long id) {
        log.info("REST request to approve car: {}", id);
        return ApiResponse.success("Duyệt xe thành công", carService.approveCar(id));
    }

    /**
     * Admin từ chối xe
     * PUT /api/v1/cars/{id}/reject?reason=...
     */
    @PutMapping("/{id}/reject")
    public ApiResponse<CarResponse> rejectCar(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        log.info("REST request to reject car: {}, reason: {}", id, reason);
        return ApiResponse.success("Từ chối xe thành công", carService.rejectCar(id, reason));
    }

    // ===== HELPER =====

    private Long extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException(ErrorCode.UNAUTHENTICATED);
        }
        String token = authHeader.substring(7);
        return jwtService.extractUserId(token);
    }
}