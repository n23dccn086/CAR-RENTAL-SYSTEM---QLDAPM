package com.carrental.auth.service;

import com.carrental.auth.dto.AuthResponse;
import com.carrental.auth.dto.LoginRequest;
import com.carrental.auth.dto.RegisterRequest;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.common.security.JwtService;
import com.carrental.user.dto.UserDto;
import com.carrental.user.dto.UserMapper;
import com.carrental.user.entity.Role;
import com.carrental.user.entity.User;
import com.carrental.user.entity.VerificationStatus;
import com.carrental.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AuthServiceImpl implements AuthService {

    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    JwtService jwtService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Register request for phone: {}", request.getPhone());

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException(ErrorCode.PHONE_EXISTED);
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()
                && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException(ErrorCode.EMAIL_EXISTED);
        }

        Role role = Role.CUSTOMER;
        if (request.getRole() != null && "owner".equalsIgnoreCase(request.getRole().trim())) {
            role = Role.OWNER;
        }

        User user = User.builder()
                .name(request.getName().trim())
                .phone(request.getPhone().trim())
                .email(request.getEmail() != null && !request.getEmail().isBlank() ? request.getEmail().trim() : null)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .verificationStatus(VerificationStatus.UNVERIFIED)
                .isActive(true)
                .build();

        User saved = userRepository.save(user);
        log.info("Registered new user with id: {}", saved.getId());

        String accessToken = jwtService.generateAccessToken(
                saved.getId(), saved.getPhone(), saved.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(saved.getId(), saved.getPhone());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(3600L)
                .user(userMapper.toDto(saved))
                .build();
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Login request for phone: {}", request.getPhone());

        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (user.getDeletedAt() != null || Boolean.FALSE.equals(user.getIsActive())) {
            throw new UnauthorizedException(ErrorCode.ACCOUNT_DISABLED);
        }

        // Cập nhật thời điểm đăng nhập gần nhất
        user.setLastLoginAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getPhone(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getPhone());

        log.info("Login success for user id: {}", user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(3600L)
                .user(userMapper.toDto(user))
                .build();
    }

    @Override
    public void logout(Long userId) {
        log.info("Logout request for user id: {}", userId);
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        log.info("Refresh token request");

        if (!jwtService.isTokenValid(refreshToken, jwtService.extractPhone(refreshToken))) {
            throw new UnauthorizedException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        String type = jwtService.extractTokenType(refreshToken);
        if (!"REFRESH".equals(type)) {
            throw new UnauthorizedException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        Long userId = jwtService.extractUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        String newAccessToken = jwtService.generateAccessToken(
                user.getId(), user.getPhone(), user.getRole().name());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(3600L)
                .user(userMapper.toDto(user))
                .build();
    }

    @Override
    public UserDto getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toDto(user);
    }

    // ============================================================
    // MỚI THÊM — 2 METHOD CHO PROFILE
    // ============================================================

    @Override
    @Transactional
    public UserDto updateProfile(Long userId, String name, String email, String address, LocalDate dateOfBirth) {
        log.info("Update profile for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        // Check email trùng (nếu đổi email)
        if (email != null && !email.isBlank() && !email.equals(user.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                throw new BadRequestException(ErrorCode.EMAIL_EXISTED);
            }
            user.setEmail(email);
        }

        if (name != null && !name.isBlank()) {
            user.setName(name);
        }
        if (address != null) {
            user.setAddress(address);
        }
        if (dateOfBirth != null) {
            user.setDateOfBirth(dateOfBirth);
        }

        User updated = userRepository.save(user);
        log.info("Profile updated for user: {}", userId);

        return userMapper.toDto(updated);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        log.info("Change password for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS);
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("Password changed for user: {}", userId);
    }
}