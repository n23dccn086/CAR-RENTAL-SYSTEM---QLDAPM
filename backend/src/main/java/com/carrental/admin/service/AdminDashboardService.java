package com.carrental.admin.service;

import com.carrental.admin.dto.AdminDepositSummaryResponse;
import com.carrental.admin.dto.DashboardStatsResponse;

public interface AdminDashboardService {
    DashboardStatsResponse getStats();
    AdminDepositSummaryResponse getDepositSummary();
}