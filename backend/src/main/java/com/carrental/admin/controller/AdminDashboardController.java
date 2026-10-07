package com.carrental.admin.controller;

import com.carrental.admin.dto.DashboardStatsResponse;
import com.carrental.admin.service.AdminDashboardService;
import com.carrental.common.dto.ApiResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminDashboardController {

    AdminDashboardService dashboardService;

    /**
     * Số liệu tổng quan cho Admin Dashboard.
     * GET /api/v1/admin/dashboard/stats
     */
    @GetMapping("/stats")
    public ApiResponse<DashboardStatsResponse> getStats() {
        return ApiResponse.success(dashboardService.getStats());
    }
}