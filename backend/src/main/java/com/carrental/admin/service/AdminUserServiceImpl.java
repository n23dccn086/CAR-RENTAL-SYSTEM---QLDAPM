package com.carrental.admin.service;

import com.carrental.admin.dto.AdminUserResponse;
import com.carrental.admin.dto.UserStatsResponse;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.user.entity.Role;
import com.carrental.user.entity.User;
import com.carrental.user.entity.VerificationStatus;
import com.carrental.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AdminUserServiceImpl implements AdminUserService {

    UserRepository userRepository;

    // ===== READ — CHỈ LẤY USER CHƯA XÓA MỀM =====

    @Override
    public List<AdminUserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getDeletedAt() == null)   // ← BỎ USER ĐÃ XÓA
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<AdminUserResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .filter(u -> u.getDeletedAt() == null)   // ← BỎ USER ĐÃ XÓA
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<AdminUserResponse> getUsersByStatus(VerificationStatus status) {
        return userRepository.findByVerificationStatus(status).stream()
                .filter(u -> u.getDeletedAt() == null)   // ← BỎ USER ĐÃ XÓA
                .map(this::toResponse)
                .toList();
    }

    @Override
    public AdminUserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));
        return toResponse(user);
    }

    // ===== LOCK / UNLOCK =====

    @Override
    @Transactional
    public AdminUserResponse lockUser(Long id) {
        log.info("Admin locking user: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        user.setDeletedAt(LocalDateTime.now());
        User updated = userRepository.save(user);
        return toResponse(updated);
    }

    @Override
    @Transactional
    public AdminUserResponse unlockUser(Long id) {
        log.info("Admin unlocking user: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        user.setDeletedAt(null);
        User updated = userRepository.save(user);
        return toResponse(updated);
    }

    // ===== SOFT DELETE =====

    @Override
    @Transactional
    public void deleteUser(Long id) {
        log.info("Admin soft-deleting user: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        // Soft delete: đánh dấu deletedAt + isActive = false
        user.setDeletedAt(LocalDateTime.now());
        user.setIsActive(false);
        userRepository.save(user);

        log.info("User soft-deleted: {}", id);
    }

    // ===== STATS =====

    @Override
    public UserStatsResponse getStats() {
        List<User> all = userRepository.findAll();

        // Chỉ đếm user CHƯA bị xóa
        List<User> activeList = all.stream()
                .filter(u -> u.getDeletedAt() == null)
                .toList();

        return UserStatsResponse.builder()
                .totalUsers(activeList.size())
                .totalCustomers(activeList.stream().filter(u -> u.getRole() == Role.CUSTOMER).count())
                .totalOwners(activeList.stream().filter(u -> u.getRole() == Role.OWNER).count())
                // .totalDrivers(...)  ← TẠM ẨN
                // .totalAdmins(...)   ← Giữ nguyên, chưa cần hiện
                .pendingVerifications(activeList.stream()
                        .filter(u -> u.getVerificationStatus() == VerificationStatus.PENDING)
                        .count())
                .activeUsers(activeList.size())
                .lockedUsers(all.stream().filter(u -> u.getDeletedAt() != null).count())
                .build();
    }

    // ===== HELPER =====

    private AdminUserResponse toResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .verificationStatus(user.getVerificationStatus())
                .rejectionReason(user.getRejectionReason())
                .address(user.getAddress())
                .dateOfBirth(user.getDateOfBirth())
                .isActive(user.getDeletedAt() == null && Boolean.TRUE.equals(user.getIsActive()))
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .deletedAt(user.getDeletedAt())
                .build();
    }
}