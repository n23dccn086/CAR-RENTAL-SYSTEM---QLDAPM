package com.carrental.driver.controller;

import com.carrental.car.service.ExcelImportService;
import com.carrental.common.dto.ApiResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller cho Owner import tài xế từ Excel.
 * Base path: /api/v1/owner/drivers
 */
@RestController
@RequestMapping("/owner/drivers")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class OwnerDriverController {

    ExcelImportService excelImportService;

    /**
     * Import Excel tài xế.
     * POST /api/v1/owner/drivers/import
     */
    @PostMapping("/import")
    public ApiResponse<ExcelImportService.ImportResult> importDrivers(
            @RequestAttribute("userId") Long ownerId,
            @RequestParam("file") MultipartFile file) {

        log.info("REST: Owner {} import drivers from Excel: {}", ownerId, file.getOriginalFilename());

        ExcelImportService.ImportResult result = excelImportService.importDrivers(file, ownerId);

        String message = String.format("Import xong: %d thành công, %d bỏ qua (trùng SĐT)",
                result.successCount(), result.skipCount());

        return ApiResponse.success(message, result);
    }
}