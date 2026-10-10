package com.carrental.auth.service;

import com.carrental.auth.dto.AuthResponse;
import com.carrental.auth.dto.LoginRequest;
import com.carrental.auth.dto.RegisterRequest;
import com.carrental.user.dto.UserDto;

import java.time.LocalDate;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(String refreshToken);

    UserDto getCurrentUser(Long userId);

    void logout(Long userId);

    // ===== MỚI THÊM =====

    UserDto updateProfile(Long userId, String name, String email, String address, LocalDate dateOfBirth);

    void changePassword(Long userId, String currentPassword, String newPassword);
}