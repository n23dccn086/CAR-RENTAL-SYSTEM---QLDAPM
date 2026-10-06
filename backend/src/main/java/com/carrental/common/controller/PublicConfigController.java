package com.carrental.common.controller;

import com.carrental.admin.service.ConfigHelper;
import com.carrental.common.dto.ApiResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Public config API — không cần auth.
 * Chỉ expose các config an toàn cho public: support_hotline, support_email.
 */
@RestController
@RequestMapping("/public/config")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PublicConfigController {

    ConfigHelper configHelper;

    /**
     * Lấy TẤT CẢ config public trong 1 request.
     * GET /api/v1/public/config
     */
    @GetMapping
    public ApiResponse<Map<String, String>> getPublicConfigs() {
        Map<String, String> result = new HashMap<>();
        result.put("support_hotline", configHelper.getSupportHotline());
        result.put("support_email", configHelper.getSupportEmail());
        return ApiResponse.success(result);
    }

    /**
     * Lấy 1 config theo key.
     * GET /api/v1/public/config/{key}
     * Chỉ cho phép: support_hotline, support_email
     */
    @GetMapping("/{key}")
    public ApiResponse<String> getConfig(@PathVariable String key) {
        // Whitelist — chỉ cho phép 2 key an toàn
        String value = switch (key) {
            case "support_hotline" -> configHelper.getSupportHotline();
            case "support_email" -> configHelper.getSupportEmail();
            default -> null;
        };

        if (value == null) {
            return ApiResponse.error(4004, "Config không tồn tại hoặc không public");
        }
        return ApiResponse.success(value);
    }
}