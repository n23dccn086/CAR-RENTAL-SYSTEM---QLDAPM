package com.carrental.car.controller;

import com.carrental.car.dto.BlockedDateRequest;
import com.carrental.car.dto.CarPricingRequest;
import com.carrental.car.dto.CarRequest;
import com.carrental.car.dto.CarResponse;
import com.carrental.car.entity.CarBlockedDate;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
     * 3.1 Tìm kiếm và lấy danh sách xe
     * GET /api/v1/cars
     */
    @GetMapping
    public ApiResponse<?> getCars(
            @RequestParam(required = false) String location,
            @RequestParam(value = "date_start", required = false) String dateStart,
            @RequestParam(value = "date_end", required = false) String dateEnd,
            @RequestParam(value = "rental_type", required = false) String rentalType,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) List<Integer> seats,
            @RequestParam(required = false) String transmission,
            @RequestParam(value = "fuel_type", required = false) String fuelType,
            @RequestParam(value = "min_price", required = false) Long minPrice,
            @RequestParam(value = "max_price", required = false) Long maxPrice,
            @RequestParam(value = "carType", required = false) String carType,
            @RequestParam(defaultValue = "pricePerDay,asc") String sort,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "limit", required = false) Integer limit,
            @RequestParam(value = "size", required = false) Integer size) {

        int pageSize = (limit != null && limit > 0) ? limit : (size != null && size > 0 ? size : 20);
        boolean hasFilter = location != null || dateStart != null || dateEnd != null || rentalType != null
                || brand != null || (seats != null && !seats.isEmpty()) || transmission != null || fuelType != null
                || minPrice != null || maxPrice != null || carType != null || limit != null;

        if (!hasFilter && page == 0 && size == null) {
            return ApiResponse.success(carService.getAllCars());
        }

        LocalDate start = (dateStart != null && !dateStart.isBlank()) ? LocalDate.parse(dateStart) : null;
        LocalDate end = (dateEnd != null && !dateEnd.isBlank()) ? LocalDate.parse(dateEnd) : null;

        int pageNum = page > 0 ? page - 1 : 0;
        Pageable pageable = PageRequest.of(pageNum, pageSize, parseSort(sort));

        Page<CarResponse> result = carService.searchAvailableCarsFull(
                location, brand, carType, transmission, fuelType, rentalType, seats, minPrice, maxPrice, start, end, pageable);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("cars", result.getContent());
        data.put("content", result.getContent());
        Map<String, Object> pagination = new LinkedHashMap<>();
        pagination.put("page", result.getNumber() + 1);
        pagination.put("limit", result.getSize());
        pagination.put("total", result.getTotalElements());
        pagination.put("total_pages", result.getTotalPages());
        data.put("pagination", pagination);
        data.put("totalPages", result.getTotalPages());
        data.put("totalElements", result.getTotalElements());

        return ApiResponse.success(data);
    }

    /**
     * 3.2 Chi tiết xe
     * GET /api/v1/cars/{id}
     */
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

    /**
     * SEARCH: Tương thích frontend
     */
    @GetMapping("/search")
    public ApiResponse<Page<CarResponse>> searchCars(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) List<Integer> seats,
            @RequestParam(required = false) String carType,
            @RequestParam(defaultValue = "pricePerDay,asc") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("REST search cars: location={}, seats={}, carType={}, sort={}, page={}, size={}",
                location, seats, carType, sort, page, size);

        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        Page<CarResponse> result = carService.searchAvailableCars(location, seats, carType, pageable);

        return ApiResponse.success(result);
    }

    @GetMapping("/{id}/images")
    public ApiResponse<List<String>> getCarImages(@PathVariable Long id) {
        log.info("REST request to get images for car {}", id);
        return ApiResponse.success(carService.getCarImages(id));
    }

    // ===== PROTECTED ENDPOINTS =====

    /**
     * 3.3 Tạo xe mới
     * POST /api/v1/cars
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ApiResponse<CarResponse> createCar(
            @Valid @RequestBody CarRequest request,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to create car: ownerId={}, plate={}", ownerId, request.getPlate());

        CarResponse response = carService.createCar(ownerId, request);
        return ApiResponse.success("Xe đã được tạo, chờ Admin duyệt", response);
    }

    /**
     * 3.4 Cập nhật xe
     * PUT /api/v1/cars/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
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
     * 3.5 Xóa xe
     * DELETE /api/v1/cars/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ApiResponse<Void> deleteCar(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to delete car: id={}, ownerId={}", id, ownerId);

        carService.deleteCar(id, ownerId);
        return ApiResponse.success("Đã xóa xe", null);
    }

    /**
     * 3.10 Danh sách xe của tôi (Chủ xe)
     * GET /api/v1/cars/my?status=available&page=1&limit=20
     */
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ApiResponse<?> getMyCars(
            @RequestParam(required = false) String status,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to get my cars: ownerId={}, status={}, page={}, limit={}", ownerId, status, page, limit);

        if (status == null && page == 0) {
            return ApiResponse.success(carService.getCarsByOwner(ownerId));
        }

        int pageNum = page > 0 ? page - 1 : 0;
        Pageable pageable = PageRequest.of(pageNum, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<CarResponse> result = carService.getCarsByOwner(ownerId, status, pageable);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("cars", result.getContent());
        data.put("content", result.getContent());
        Map<String, Object> pagination = new LinkedHashMap<>();
        pagination.put("page", result.getNumber() + 1);
        pagination.put("limit", result.getSize());
        pagination.put("total", result.getTotalElements());
        pagination.put("total_pages", result.getTotalPages());
        data.put("pagination", pagination);

        return ApiResponse.success(data);
    }

    // ===== 3.6 ẢNH XE =====

    @PostMapping("/{id}/images")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ApiResponse<?> uploadImages(
            @PathVariable Long id,
            @RequestParam("images") MultipartFile[] files,
            @RequestParam(value = "image_types", required = false) String[] imageTypes,
            HttpServletRequest httpRequest) throws IOException {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to upload {} images for car {} by owner {}", files.length, id, ownerId);

        List<Map<String, Object>> images = carService.uploadImagesWithTypes(id, ownerId, files, imageTypes);
        List<String> urls = images.stream().map(m -> (String) m.get("image_url")).toList();

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("images", images);
        data.put("urls", urls);

        return ApiResponse.success("Upload ảnh thành công", data);
    }

    @DeleteMapping("/{id}/images")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ApiResponse<Void> deleteImage(
            @PathVariable Long id,
            @RequestParam("imageUrl") String imageUrl,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to delete image for car {} by owner {}", id, ownerId);

        carService.deleteImage(id, ownerId, imageUrl);
        return ApiResponse.success("Xóa ảnh thành công", null);
    }

    // ===== 3.7 UPLOAD GIẤY TỜ XE =====

    @PostMapping("/{id}/documents")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ApiResponse<Map<String, Object>> uploadDocuments(
            @PathVariable Long id,
            @RequestParam(value = "registration", required = false) MultipartFile registration,
            @RequestParam(value = "inspection", required = false) MultipartFile inspection,
            @RequestParam(value = "insurance_liability", required = false) MultipartFile insuranceLiability,
            @RequestParam(value = "insurance_physical", required = false) MultipartFile insurancePhysical,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "doc_type", required = false) String docType,
            HttpServletRequest httpRequest) throws IOException {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to upload documents for car {}", id);

        Map<String, MultipartFile> docMap = new LinkedHashMap<>();
        if (registration != null) docMap.put("registration", registration);
        if (inspection != null) docMap.put("inspection", inspection);
        if (insuranceLiability != null) docMap.put("insurance_liability", insuranceLiability);
        if (insurancePhysical != null) docMap.put("insurance_physical", insurancePhysical);
        if (file != null && docType != null) docMap.put(docType, file);

        List<Map<String, Object>> docs = carService.uploadDocuments(id, ownerId, docMap);
        Map<String, Object> responseData = new LinkedHashMap<>();
        responseData.put("documents", docs);

        return ApiResponse.success("Upload giấy tờ xe thành công", responseData);
    }

    // ===== 3.8 CẤU HÌNH GIÁ XE =====

    @PutMapping("/{id}/pricing")
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ApiResponse<CarResponse> configurePricing(
            @PathVariable Long id,
            @RequestBody CarPricingRequest request,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to configure pricing for car {}: {}", id, request);

        CarResponse response = carService.configurePricing(id, ownerId, request);
        return ApiResponse.success("Cấu hình giá thành công", response);
    }

    // ===== 3.9 CHẶN LỊCH XE =====

    @PostMapping("/{id}/blocked-dates")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
    public ApiResponse<CarBlockedDate> blockDates(
            @PathVariable Long id,
            @Valid @RequestBody BlockedDateRequest request,
            HttpServletRequest httpRequest) {

        Long ownerId = extractUserId(httpRequest);
        log.info("REST request to block dates for car {}: {}", id, request);

        CarBlockedDate blockedDate = carService.blockDates(id, ownerId, request);
        return ApiResponse.success("Chặn lịch xe thành công", blockedDate);
    }

    // ===== ADMIN =====

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CarResponse> approveCar(@PathVariable Long id) {
        log.info("REST request to approve car: {}", id);
        return ApiResponse.success("Duyệt xe thành công", carService.approveCar(id));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CarResponse> rejectCar(
            @PathVariable Long id,
            @RequestParam(required = false) String reason) {
        log.info("REST request to reject car: {}, reason: {}", id, reason);
        return ApiResponse.success("Từ chối xe thành công", carService.rejectCar(id, reason));
    }

    // ===== HELPER =====

    private Sort parseSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.ASC, "price_per_day");
        }
        String s = sort.trim().toLowerCase();
        return switch (s) {
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "price_per_day");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price_per_day");
            case "rating" -> Sort.by(Sort.Direction.DESC, "id");
            case "newest" -> Sort.by(Sort.Direction.DESC, "created_at");
            default -> {
                String[] parts = sort.split(",");
                Sort.Direction dir = parts.length > 1 && parts[1].equalsIgnoreCase("desc")
                        ? Sort.Direction.DESC : Sort.Direction.ASC;
                String field = mapSortField(parts[0]);
                yield Sort.by(dir, field);
            }
        };
    }

    private String mapSortField(String jpaField) {
        return switch (jpaField) {
            case "pricePerDay" -> "price_per_day";
            case "priceWeekend" -> "price_weekend";
            case "priceHoliday" -> "price_holiday";
            case "createdAt" -> "created_at";
            case "updatedAt" -> "updated_at";
            case "currentKm" -> "current_km";
            case "extraKmPrice" -> "extra_km_price";
            case "deliveryFee" -> "delivery_fee";
            case "cleaningFee" -> "cleaning_fee";
            case "rentalMode" -> "rental_mode";
            case "carType" -> "car_type";
            default -> jpaField;
        };
    }

    private Long extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException(ErrorCode.UNAUTHENTICATED);
        }
        String token = authHeader.substring(7);
        return jwtService.extractUserId(token);
    }
}