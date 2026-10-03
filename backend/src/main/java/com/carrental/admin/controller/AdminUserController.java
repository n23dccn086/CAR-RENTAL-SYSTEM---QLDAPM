package com.carrental.admin.controller;

import com.carrental.admin.dto.AdminUserResponse;
import com.carrental.admin.dto.UserStatsResponse;
import com.carrental.admin.service.AdminUserService;
import com.carrental.common.dto.ApiResponse;
import com.carrental.user.entity.Role;
import com.carrental.user.entity.VerificationStatus;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    AdminUserService adminUserService;

    /**
     * Lấy danh sách user (có filter theo role/status).
     * GET /api/v1/admin/users?role=CUSTOMER&status=PENDING
     */
    @GetMapping
    public ApiResponse<List<AdminUserResponse>> getAllUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) VerificationStatus status) {

        if (role != null) {
            return ApiResponse.success(adminUserService.getUsersByRole(role));
        }
        if (status != null) {
            return ApiResponse.success(adminUserService.getUsersByStatus(status));
        }
        return ApiResponse.success(adminUserService.getAllUsers());
    }

    /**
     * Thống kê user.
     * GET /api/v1/admin/users/stats
     */
    @GetMapping("/stats")
    public ApiResponse<UserStatsResponse> getStats() {
        return ApiResponse.success(adminUserService.getStats());
    }

    /**
     * Chi tiết user.
     * GET /api/v1/admin/users/{id}
     */
    @GetMapping("/{id}")
    public ApiResponse<AdminUserResponse> getUserById(@PathVariable Long id) {
        return ApiResponse.success(adminUserService.getUserById(id));
    }

    /**
     * Khóa tài khoản.
     * PUT /api/v1/admin/users/{id}/lock
     */
    @PutMapping("/{id}/lock")
    public ApiResponse<AdminUserResponse> lockUser(@PathVariable Long id) {
        log.info("REST: Admin locking user {}", id);
        return ApiResponse.success("Đã khóa tài khoản", adminUserService.lockUser(id));
    }

    /**
     * Mở khóa tài khoản.
     * PUT /api/v1/admin/users/{id}/unlock
     */
    @PutMapping("/{id}/unlock")
    public ApiResponse<AdminUserResponse> unlockUser(@PathVariable Long id) {
        log.info("REST: Admin unlocking user {}", id);
        return ApiResponse.success("Đã mở khóa tài khoản", adminUserService.unlockUser(id));
    }

    /**
     * Xóa user (hard delete).
     * DELETE /api/v1/admin/users/{id}
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteUser(@PathVariable Long id) {
        log.info("REST: Admin deleting user {}", id);
        adminUserService.deleteUser(id);
        return ApiResponse.success("Đã xóa tài khoản", null);
    }
}