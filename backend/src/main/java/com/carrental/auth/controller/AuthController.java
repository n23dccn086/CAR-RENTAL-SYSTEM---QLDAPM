package com.carrental.auth.controller;

import com.carrental.auth.dto.AuthResponse;
import com.carrental.auth.dto.ForgotPasswordRequest;
import com.carrental.auth.dto.LoginRequest;
import com.carrental.auth.dto.RegisterRequest;
import com.carrental.auth.dto.ResetPasswordRequest;
import com.carrental.auth.service.AuthService;
import com.carrental.auth.service.OtpService;
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
    OtpService otpService;  // ★ MỚI

    /**
     * Đăng ký tài khoản mới (UC-C01)
     * POST /api/v1/auth/register
     */
    @PostMapping("/register")
    @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("REST request to register user: {}", request.getPhone());
        AuthResponse response = authService.register(request);
        return ApiResponse.success("Đăng ký thành công", response);
    }

    /**
     * Đăng nhập (UC-C02)
     * POST /api/v1/auth/login
     */
    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("REST request to login user: {}", request.getPhone());
        AuthResponse response = authService.login(request);
        return ApiResponse.success("Đăng nhập thành công", response);
    }

    /**
     * Refresh access token (1.3)
     * POST /api/v1/auth/refresh
     */
    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(
            @RequestBody(required = false) com.carrental.auth.dto.RefreshTokenRequest body,
            @RequestParam(value = "token", required = false) String tokenParam,
            @RequestParam(value = "refresh_token", required = false) String refreshTokenParam) {
        String token = null;
        if (body != null && body.getRefreshToken() != null && !body.getRefreshToken().isBlank()) {
            token = body.getRefreshToken();
        } else if (tokenParam != null && !tokenParam.isBlank()) {
            token = tokenParam;
        } else if (refreshTokenParam != null && !refreshTokenParam.isBlank()) {
            token = refreshTokenParam;
        }

        if (token == null || token.isBlank()) {
            throw new com.carrental.common.exception.BadRequestException(
                    com.carrental.common.constant.ErrorCode.VALIDATION_ERROR,
                    "Refresh token không được để trống"
            );
        }

        log.info("REST request to refresh token");
        AuthResponse response = authService.refreshToken(token);
        return ApiResponse.success("Token đã được làm mới", response);
    }

    /**
     * Đăng xuất (1.4)
     * POST /api/v1/auth/logout
     */
    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request) {
        log.info("REST request to logout");
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                Long userId = jwtService.extractUserId(authHeader.substring(7));
                authService.logout(userId);
            } catch (Exception e) {
                log.debug("Logout token extraction ignored: {}", e.getMessage());
            }
        }
        return ApiResponse.success("Đăng xuất thành công", null);
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

    // ============================================================
    // ★ MỚI: QUÊN MẬT KHẨU — OTP SMS
    // ============================================================

    /**
     * Quên mật khẩu — gửi OTP qua SMS (Mock — in ra console).
     * POST /api/v1/auth/forgot-password
     */
    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("REST request to forgot password for phone: {}", request.getPhone());
        otpService.sendOtp(request.getPhone());
        return ApiResponse.success(
                "Mã OTP đã được gửi. Vui lòng kiểm tra tin nhắn (console backend).",
                null
        );
    }

    /**
     * Đặt lại mật khẩu bằng OTP.
     * POST /api/v1/auth/reset-password
     */
    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("REST request to reset password for phone: {}", request.getPhone());
        otpService.verifyAndResetPassword(
                request.getPhone(), request.getOtp(), request.getNewPassword());
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

        @com.fasterxml.jackson.annotation.JsonAlias({"date_of_birth", "dateOfBirth"})
        private LocalDate dateOfBirth;
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank(message = "Mật khẩu hiện tại không được để trống")
        @com.fasterxml.jackson.annotation.JsonAlias({"current_password", "currentPassword"})
        private String currentPassword;

        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Size(min = 8, message = "Mật khẩu mới phải có ít nhất 8 ký tự")
        @com.fasterxml.jackson.annotation.JsonAlias({"new_password", "newPassword"})
        private String newPassword;
    }
}