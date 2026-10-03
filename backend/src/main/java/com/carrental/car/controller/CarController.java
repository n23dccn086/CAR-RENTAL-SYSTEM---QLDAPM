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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    @GetMapping
    public ApiResponse<List<CarResponse>> getAllCars() {
        log.info("REST request to get all cars");
        return ApiResponse.success(carService.getAllCars());
    }

    @GetMapping("/{id}")
    public ApiResponse<CarResponse> getCarById(@PathVariable Long id) {
        log.info("REST request to get car: {}", id);
        return ApiResponse.success(carService.getCarById(id));
    }

    @GetMapping("/available")
    public ApiResponse<List<CarResponse>> getAvailableCars() {
        log.info("REST request to get available cars");
        return ApiResponse.success(carService.getAvailableCars());
    }

    @GetMapping("/search")
    public ApiResponse<List<CarResponse>> searchCars(
            @RequestParam(required = false) CarStatus status,
            @RequestParam(required = false) CarType type) {
        log.info("REST request to search cars: status={}, type={}", status, type);
        return ApiResponse.success(carService.searchCars(status, type));
    }

    // ===== PROTECTED ENDPOINTS =====

    @PostMapping
    public ApiResponse<CarResponse> createCar(
            @Valid @RequestBody CarRequest request,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to create car: ownerId={}, plate={}", ownerId, request.getPlate());

        CarResponse response = carService.createCar(ownerId, request);
        return ApiResponse.success("Tạo xe thành công. Vui lòng chờ Admin duyệt.", response);
    }

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

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteCar(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to delete car: id={}, ownerId={}", id, ownerId);

        carService.deleteCar(id, ownerId);
        return ApiResponse.success("Xóa xe thành công", null);
    }

    @GetMapping("/my")
    public ApiResponse<List<CarResponse>> getMyCars(HttpServletRequest httpRequest) {
        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to get my cars: ownerId={}", ownerId);

        return ApiResponse.success(carService.getCarsByOwner(ownerId));
    }

    // ===== ẢNH XE — UPLOAD + GET =====

    /**
     * Upload ảnh cho xe
     * POST /api/v1/cars/{id}/images
     */
    @PostMapping("/{id}/images")
    public ApiResponse<List<String>> uploadImages(
            @PathVariable Long id,
            @RequestParam("images") MultipartFile[] files,
            HttpServletRequest httpRequest) throws IOException {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to upload {} images for car {} by owner {}", files.length, id, ownerId);

        List<String> urls = carService.uploadImages(id, ownerId, files);
        return ApiResponse.success("Upload ảnh thành công", urls);
    }

    /**
     * Lấy danh sách ảnh của xe
     * GET /api/v1/cars/{id}/images
     */
    @GetMapping("/{id}/images")
    public ApiResponse<List<String>> getCarImages(@PathVariable Long id) {
        log.info("REST request to get images for car {}", id);
        return ApiResponse.success(carService.getCarImages(id));
    }

    /**
     * Xóa 1 ảnh của xe
     * DELETE /api/v1/cars/{id}/images
     */
    @DeleteMapping("/{id}/images")
    public ApiResponse<Void> deleteImage(
            @PathVariable Long id,
            @RequestParam("imageUrl") String imageUrl,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to delete image for car {} by owner {}", id, ownerId);

        carService.deleteImage(id, ownerId, imageUrl);
        return ApiResponse.success("Xóa ảnh thành công", null);
    }

    // ===== ADMIN ENDPOINTS =====

    @PutMapping("/{id}/approve")
    public ApiResponse<CarResponse> approveCar(@PathVariable Long id) {
        log.info("REST request to approve car: {}", id);
        return ApiResponse.success("Duyệt xe thành công", carService.approveCar(id));
    }

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