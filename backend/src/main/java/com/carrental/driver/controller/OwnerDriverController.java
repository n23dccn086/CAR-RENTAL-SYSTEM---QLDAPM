package com.carrental.driver.controller;

import com.carrental.car.service.ExcelImportService;
import com.carrental.common.dto.ApiResponse;
import com.carrental.common.service.FileStorageService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Controller cho Owner import tài xế từ Excel và upload avatar tài xế.
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
    FileStorageService fileStorageService;

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

    /**
     * Upload ảnh avatar tài xế (trước khi tạo/sửa tài xế).
     * POST /api/v1/owner/drivers/upload-avatar
     * Trả về URL ảnh — FE gán vào trường avatarUrl của tài xế.
     */
    @PostMapping("/upload-avatar")
    public ApiResponse<String> uploadAvatar(
            @RequestAttribute("userId") Long ownerId,
            @RequestParam("file") MultipartFile file) throws IOException {

        log.info("REST: Owner {} uploading driver avatar", ownerId);
        String url = fileStorageService.storeImage(file, "drivers/avatars/" + ownerId);
        return ApiResponse.success("Upload ảnh thành công", url);
    }
}
