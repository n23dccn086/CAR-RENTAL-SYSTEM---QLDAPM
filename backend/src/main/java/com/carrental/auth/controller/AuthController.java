package com.carrental.auth.controller;

import com.carrental.auth.dto.AuthResponse;
import com.carrental.auth.dto.LoginRequest;
import com.carrental.auth.dto.RegisterRequest;
import com.carrental.auth.service.AuthService;
import com.carrental.common.dto.ApiResponse;
import com.carrental.common.security.JwtService;
import com.carrental.user.dto.UserDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AuthController {

    AuthService authService;
    JwtService jwtService;

    /**
     * Đăng ký tài khoản mới
     * POST /api/v1/auth/register
     */
    @PostMapping("/register")
    public ApiResponse<UserDto> register(@Valid @RequestBody RegisterRequest request) {
        log.info("REST request to register user: {}", request.getPhone());
        UserDto user = authService.register(request);
        return ApiResponse.success("Đăng ký thành công. Vui lòng xác thực GPLX.", user);
    }

    /**
     * Đăng nhập
     * POST /api/v1/auth/login
     */
    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("REST request to login user: {}", request.getPhone());
        AuthResponse response = authService.login(request);
        return ApiResponse.success("Đăng nhập thành công", response);
    }

    /**
     * Refresh access token
     * POST /api/v1/auth/refresh
     */
    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@RequestParam("token") String refreshToken) {
        log.info("REST request to refresh token");
        AuthResponse response = authService.refreshToken(refreshToken);
        return ApiResponse.success("Token đã được làm mới", response);
    }

    /**
     * Lấy thông tin user hiện tại (cần JWT)
     * GET /api/v1/auth/me
     */
    @GetMapping("/me")
    public ApiResponse<UserDto> getCurrentUser(HttpServletRequest request) {
        // Lấy token từ header "Authorization: Bearer xxx"
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new com.carrental.common.exception.UnauthorizedException(
                    com.carrental.common.constant.ErrorCode.UNAUTHENTICATED);
        }

        String token = authHeader.substring(7);
        Long userId = jwtService.extractUserId(token);

        log.info("REST request to get current user id: {}", userId);
        UserDto user = authService.getCurrentUser(userId);
        return ApiResponse.success(user);
    }
}