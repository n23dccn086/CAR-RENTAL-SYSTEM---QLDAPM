package com.carrental.user.controller;

import com.carrental.auth.controller.AuthController.ChangePasswordRequest;
import com.carrental.auth.controller.AuthController.UpdateProfileRequest;
import com.carrental.auth.service.AuthService;
import com.carrental.common.dto.ApiResponse;
import com.carrental.common.security.JwtService;
import com.carrental.user.dto.SubmitVerificationRequest;
import com.carrental.user.dto.UserDto;
import com.carrental.user.service.VerificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserController {

    AuthService authService;
    JwtService jwtService;
    VerificationService verificationService;

    /**
     * 2.1 Lấy thông tin user hiện tại (1.5)
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
     * 2.1 Cập nhật hồ sơ cá nhân
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
     * 2.2 Upload GPLX
     * POST /api/v1/users/documents/gplx
     */
    @PostMapping("/documents/gplx")
    public ApiResponse<Map<String, Object>> uploadGplx(
            @RequestAttribute(value = "userId", required = false) Long userId,
            HttpServletRequest request,
            @RequestParam("gplx_front") MultipartFile gplxFront,
            @RequestParam("gplx_back") MultipartFile gplxBack,
            @RequestParam(value = "gplx_number", required = false) String gplxNumber,
            @RequestParam(value = "gplx_class", required = false) String gplxClass) throws IOException {
        Long resolvedUserId = userId != null ? userId : extractUserId(request);
        log.info("REST: User {} uploading GPLX", resolvedUserId);
        return ApiResponse.success("Upload GPLX thành công",
                verificationService.uploadGplx(resolvedUserId, gplxFront, gplxBack, gplxNumber, gplxClass));
    }

    /**
     * 2.3 Upload CCCD
     * POST /api/v1/users/documents/cccd
     */
    @PostMapping("/documents/cccd")
    public ApiResponse<Map<String, Object>> uploadCccd(
            @RequestAttribute(value = "userId", required = false) Long userId,
            HttpServletRequest request,
            @RequestParam("cccd_front") MultipartFile cccdFront,
            @RequestParam("cccd_back") MultipartFile cccdBack,
            @RequestParam(value = "cccd_number", required = false) String cccdNumber) throws IOException {
        Long resolvedUserId = userId != null ? userId : extractUserId(request);
        log.info("REST: User {} uploading CCCD", resolvedUserId);
        return ApiResponse.success(
                verificationService.uploadCccd(resolvedUserId, cccdFront, cccdBack, cccdNumber));
    }

    /**
     * 2.4 Upload Selfie
     * POST /api/v1/users/documents/selfie
     */
    @PostMapping("/documents/selfie")
    public ApiResponse<Map<String, Object>> uploadSelfie(
            @RequestAttribute(value = "userId", required = false) Long userId,
            HttpServletRequest request,
            @RequestParam("selfie") MultipartFile selfie) throws IOException {
        Long resolvedUserId = userId != null ? userId : extractUserId(request);
        log.info("REST: User {} uploading selfie", resolvedUserId);
        return ApiResponse.success(
                verificationService.uploadSelfie(resolvedUserId, selfie));
    }

    /**
     * 2.5 Gửi hồ sơ xác thực
     * POST /api/v1/users/submit-verification
     */
    @PostMapping("/submit-verification")
    public ApiResponse<Map<String, Object>> submitVerification(
            @RequestAttribute(value = "userId", required = false) Long userId,
            HttpServletRequest request,
            @RequestBody(required = false) SubmitVerificationRequest body) {
        Long resolvedUserId = userId != null ? userId : extractUserId(request);
        log.info("REST: User {} submit-verification", resolvedUserId);
        return ApiResponse.success("Hồ sơ đã được gửi, chờ Admin duyệt",
                verificationService.submitVerification(resolvedUserId, body));
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
