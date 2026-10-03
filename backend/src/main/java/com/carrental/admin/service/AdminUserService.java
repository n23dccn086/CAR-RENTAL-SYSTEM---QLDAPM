package com.carrental.admin.service;

import com.carrental.admin.dto.AdminUserResponse;
import com.carrental.admin.dto.UserStatsResponse;
import com.carrental.user.entity.Role;
import com.carrental.user.entity.VerificationStatus;

import java.util.List;

public interface AdminUserService {

    List<AdminUserResponse> getAllUsers();

    List<AdminUserResponse> getUsersByRole(Role role);

    List<AdminUserResponse> getUsersByStatus(VerificationStatus status);

    AdminUserResponse getUserById(Long id);

    AdminUserResponse lockUser(Long id);

    AdminUserResponse unlockUser(Long id);

    void deleteUser(Long id);

    UserStatsResponse getStats();
}