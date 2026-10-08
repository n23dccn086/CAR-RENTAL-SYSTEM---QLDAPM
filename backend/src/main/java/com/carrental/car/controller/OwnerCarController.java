package com.carrental.car.controller;

import com.carrental.car.dto.CarResponse;
import com.carrental.car.service.CarService;
import com.carrental.car.service.ExcelImportService;
import com.carrental.common.dto.ApiResponse;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/owner/cars")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class OwnerCarController {

    CarService carService;
    ExcelImportService excelImportService;  // ★ THÊM

    /**
     * Lấy danh sách xe của owner với filter + search + sort + phân trang.
     */
    @GetMapping
    public ApiResponse<Page<CarResponse>> getMyCars(
            @RequestAttribute("userId") Long ownerId,
            @RequestParam(required = false) String carType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) List<Integer> seats,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        log.info("REST: Owner {} get cars, filters: carType={}, status={}, seats={}, search={}",
                ownerId, carType, status, seats, search);

        String[] sortParts = sort.split(",");
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("desc")
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        String sortField = mapSortField(sortParts[0]);

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));

        Page<CarResponse> cars = carService.searchOwnerCars(
                ownerId, carType, status, seats, search, pageable);

        return ApiResponse.success(cars);
    }

    /**
     * ★ Owner đổi trạng thái xe.
     * PATCH /api/v1/owner/cars/{id}/status
     * Body: { "status": "AVAILABLE" | "MAINTENANCE" | "BROKEN" | "INACTIVE" }
     */
    @PatchMapping("/{id}/status")
    public ApiResponse<CarResponse> updateStatus(
            @PathVariable Long id,
            @RequestAttribute("userId") Long ownerId,
            @RequestBody UpdateStatusRequest body) {

        log.info("REST: Owner {} update car {} status to {}", ownerId, id, body.getStatus());

        CarResponse updated = carService.updateCarStatus(id, ownerId, body.getStatus());
        return ApiResponse.success("Cập nhật trạng thái thành công", updated);
    }

    /**
     * ★ Import Excel xe.
     * POST /api/v1/owner/cars/import
     */
    @PostMapping("/import")
    public ApiResponse<ExcelImportService.ImportResult> importCars(
            @RequestAttribute("userId") Long ownerId,
            @RequestParam("file") MultipartFile file) {

        log.info("REST: Owner {} import cars from Excel: {}", ownerId, file.getOriginalFilename());

        ExcelImportService.ImportResult result = excelImportService.importCars(file, ownerId);

        String message = String.format("Import xong: %d thành công, %d bỏ qua (trùng biển số)",
                result.successCount(), result.skipCount());

        return ApiResponse.success(message, result);
    }

    // ===== HELPER =====

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

    // ===== DTO =====

    @Data
    public static class UpdateStatusRequest {
        @NotBlank(message = "Trạng thái không được để trống")
        private String status;
    }
}