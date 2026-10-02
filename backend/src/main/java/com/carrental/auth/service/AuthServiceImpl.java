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
    public UserDto register(RegisterRequest request) {
        log.info("Register request for phone: {}", request.getPhone());

        // Check phone trùng
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException(ErrorCode.PHONE_EXISTED);
        }

        // Check email trùng (nếu có)
        if (request.getEmail() != null && !request.getEmail().isBlank()
                && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException(ErrorCode.EMAIL_EXISTED);
        }

        // Tạo user mới
        User user = User.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.CUSTOMER)
                .verificationStatus(VerificationStatus.UNVERIFIED)
                .build();

        User saved = userRepository.save(user);
        log.info("Registered new user with id: {}", saved.getId());

        return userMapper.toDto(saved);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        log.info("Login request for phone: {}", request.getPhone());

        // Tìm user theo phone
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS));

        // Check password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException(ErrorCode.INVALID_CREDENTIALS);
        }

        // Check tài khoản bị khóa
        if (user.getDeletedAt() != null) {
            throw new UnauthorizedException(ErrorCode.ACCOUNT_DISABLED);
        }

        // Sinh token
        String accessToken = jwtService.generateAccessToken(
                user.getId(), user.getPhone(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getPhone());

        log.info("Login success for user id: {}", user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(3600L)          // 1 giờ
                .user(userMapper.toDto(user))
                .build();
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        log.info("Refresh token request");

        // Verify refresh token
        if (!jwtService.isTokenValid(refreshToken, jwtService.extractPhone(refreshToken))) {
            throw new UnauthorizedException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        // Check type
        String type = jwtService.extractTokenType(refreshToken);
        if (!"REFRESH".equals(type)) {
            throw new UnauthorizedException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        Long userId = jwtService.extractUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND));

        // Sinh access token mới
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
}