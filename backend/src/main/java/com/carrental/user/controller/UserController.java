package com.carrental.user.controller;

import com.carrental.auth.controller.AuthController.ChangePasswordRequest;
import com.carrental.auth.controller.AuthController.UpdateProfileRequest;
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
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserController {

    AuthService authService;
    JwtService jwtService;

    /**
     * Lấy thông tin user hiện tại (2.1 / 1.5)
     * GET /api/v1/users/me
     */
    @GetMapping("/me")
    public ApiResponse<UserDto> getMe(
            @RequestAttribute(value = "userId", required = false) Long userId,
            HttpServletRequest request) {
        Long resolvedUserId = userId != null ? userId : extractUserId(request);
        log.info("REST request to get user /users/me: {}", resolvedUserId);
        return ApiResponse.success(authService.getCurrentUser(resolvedUserId));
    }

    /**
     * Cập nhật hồ sơ cá nhân (2.1 - PDF Page 212)
     * PUT /api/v1/users/me
     */
    @PutMapping("/me")
    public ApiResponse<UserDto> updateProfile(
            @RequestAttribute(value = "userId", required = false) Long userId,
            HttpServletRequest request,
            @Valid @RequestBody UpdateProfileRequest body) {
        Long resolvedUserId = userId != null ? userId : extractUserId(request);
        log.info("REST request to update user /users/me: {}", resolvedUserId);
        UserDto user = authService.updateProfile(resolvedUserId, body.getName(),
                body.getEmail(), body.getAddress(), body.getDateOfBirth());
        return ApiResponse.success("Cập nhật thành công", user);
    }

    /**
     * Đổi mật khẩu
     * POST /api/v1/users/change-password
     */
    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(
            @RequestAttribute(value = "userId", required = false) Long userId,
            HttpServletRequest request,
            @Valid @RequestBody ChangePasswordRequest body) {
        Long resolvedUserId = userId != null ? userId : extractUserId(request);
        log.info("REST request to change password via /users: {}", resolvedUserId);
        authService.changePassword(resolvedUserId, body.getCurrentPassword(), body.getNewPassword());
        return ApiResponse.success("Đổi mật khẩu thành công", null);
    }

    private Long extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new com.carrental.common.exception.UnauthorizedException(
                    com.carrental.common.constant.ErrorCode.UNAUTHENTICATED);
        }
        return jwtService.extractUserId(authHeader.substring(7));
    }
}
