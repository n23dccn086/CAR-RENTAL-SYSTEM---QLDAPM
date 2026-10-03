package com.carrental.admin.controller;

import com.carrental.admin.dto.ConfigResponse;
import com.carrental.admin.service.AdminConfigService;
import com.carrental.common.dto.ApiResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller cấu hình nền tảng (Admin).
 * Base path: /api/v1/admin/config
 */
@RestController
@RequestMapping("/admin/config")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AdminConfigController {

    AdminConfigService configService;

    /**
     * Lấy tất cả config.
     * GET /api/v1/admin/config
     */
    @GetMapping
    public ApiResponse<List<ConfigResponse>> getAllConfigs() {
        return ApiResponse.success(configService.getAllConfigs());
    }

    /**
     * Lấy config theo key.
     * GET /api/v1/admin/config/{key}
     */
    @GetMapping("/{key}")
    public ApiResponse<ConfigResponse> getConfigByKey(@PathVariable String key) {
        return ApiResponse.success(configService.getConfigByKey(key));
    }

    /**
     * Cập nhật config.
     * PUT /api/v1/admin/config/{key}
     */
    @PutMapping("/{key}")
    public ApiResponse<ConfigResponse> updateConfig(
            @PathVariable String key,
            @RequestAttribute("userId") Long adminId,
            @RequestParam String value) {
        log.info("REST: Admin {} updating config {}", adminId, key);
        return ApiResponse.success("Cập nhật config thành công",
                configService.updateConfig(key, value, adminId));
    }

    /**
     * Tạo config mới.
     * POST /api/v1/admin/config
     */
    @PostMapping
    public ApiResponse<ConfigResponse> createConfig(
            @RequestAttribute("userId") Long adminId,
            @RequestParam String key,
            @RequestParam String value,
            @RequestParam(required = false, defaultValue = "STRING") String type,
            @RequestParam(required = false) String description) {
        log.info("REST: Admin {} creating config {}", adminId, key);
        return ApiResponse.success("Tạo config thành công",
                configService.createConfig(key, value, type, description, adminId));
    }
}