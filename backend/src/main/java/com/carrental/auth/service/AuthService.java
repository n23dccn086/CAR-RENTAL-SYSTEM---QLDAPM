package com.carrental.auth.service;

import com.carrental.auth.dto.AuthResponse;
import com.carrental.auth.dto.LoginRequest;
import com.carrental.auth.dto.RegisterRequest;
import com.carrental.user.dto.UserDto;

public interface AuthService {

    UserDto register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(String refreshToken);

    UserDto getCurrentUser(Long userId);
}