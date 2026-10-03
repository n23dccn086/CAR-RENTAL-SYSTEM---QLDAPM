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
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

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

    /**
     * Cập nhật hồ sơ cá nhân
     * PUT /api/v1/auth/me
     */
    @PutMapping("/me")
    public ApiResponse<UserDto> updateProfile(
            HttpServletRequest request,
            @Valid @RequestBody UpdateProfileRequest body) {
        Long userId = extractUserId(request);
        log.info("REST request to update profile user id: {}", userId);
        UserDto user = authService.updateProfile(userId, body.getName(),
                body.getEmail(), body.getAddress(), body.getDateOfBirth());
        return ApiResponse.success("Cập nhật hồ sơ thành công", user);
    }

    /**
     * Đổi mật khẩu
     * POST /api/v1/auth/change-password
     */
    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(
            HttpServletRequest request,
            @Valid @RequestBody ChangePasswordRequest body) {
        Long userId = extractUserId(request);
        log.info("REST request to change password user id: {}", userId);
        authService.changePassword(userId, body.getCurrentPassword(), body.getNewPassword());
        return ApiResponse.success("Đổi mật khẩu thành công", null);
    }

    /**
     * Helper: Extract userId from JWT
     */
    private Long extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new com.carrental.common.exception.UnauthorizedException(
                    com.carrental.common.constant.ErrorCode.UNAUTHENTICATED);
        }
        return jwtService.extractUserId(authHeader.substring(7));
    }

    // ===== DTOs =====

    @Data
    public static class UpdateProfileRequest {
        @NotBlank(message = "Họ tên không được để trống")
        @Size(min = 2, max = 100, message = "Họ tên từ 2 đến 100 ký tự")
        private String name;

        @Email(message = "Email không đúng định dạng")
        private String email;

        @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
        private String address;

        private LocalDate dateOfBirth;
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank(message = "Mật khẩu hiện tại không được để trống")
        private String currentPassword;

        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Size(min = 8, message = "Mật khẩu mới phải có ít nhất 8 ký tự")
        private String newPassword;
    }
}