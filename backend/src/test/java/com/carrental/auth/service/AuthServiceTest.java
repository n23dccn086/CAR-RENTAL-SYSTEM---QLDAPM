package com.carrental.auth.service;

import com.carrental.auth.dto.LoginRequest;
import com.carrental.auth.dto.RegisterRequest;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.user.entity.User;
import com.carrental.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private com.carrental.common.security.JwtService jwtService;

    @Mock
    private com.carrental.user.dto.UserMapper userMapper;

    @InjectMocks
    private AuthServiceImpl authService;

    // ===== TEST 1: Đăng nhập sai mật khẩu =====
    @Test
    @DisplayName("TC02 - Test đăng nhập sai mật khẩu phải ném lỗi UnauthorizedException")
    public void testLoginWithWrongPassword() {
        LoginRequest request = new LoginRequest();
        request.setPhone("0900000003");
        request.setPassword("WrongPassword123");

        User mockUser = new User();
        mockUser.setId(3L);
        mockUser.setPhone("0900000003");
        mockUser.setPasswordHash("hashed_password_trong_db");
        mockUser.setIsActive(true);

        when(userRepository.findByPhone("0900000003")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("WrongPassword123", "hashed_password_trong_db")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> {
            authService.login(request);
        }, "Đăng nhập sai mật khẩu phải ném ra UnauthorizedException");
    }

    // ===== TEST 2: Đăng ký trùng SĐT =====
    @Test
    @DisplayName("TC10 - Test chặn đăng ký trùng số điện thoại")
    public void testRegisterDuplicatePhone() {
        RegisterRequest request = new RegisterRequest();
        request.setPhone("0900000003");

        when(userRepository.existsByPhone("0900000003")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> {
            authService.register(request);
        }, "Đăng ký trùng SĐT phải bị chặn");
    }

    // ===== TEST 3: Chặn đăng nhập khi tài khoản bị khóa =====
    @Test
    @DisplayName("TC - Test chặn đăng nhập khi tài khoản bị khóa")
    public void testLoginWithLockedAccount() {
        LoginRequest request = new LoginRequest();
        request.setPhone("0900000003");
        request.setPassword("Admin@123");

        User mockUser = new User();
        mockUser.setId(3L);
        mockUser.setPhone("0900000003");
        mockUser.setPasswordHash("hashed_password");
        mockUser.setIsActive(false);

        when(userRepository.findByPhone("0900000003")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("Admin@123", "hashed_password")).thenReturn(true);

        assertThrows(UnauthorizedException.class, () -> {
            authService.login(request);
        }, "Đăng nhập vào tài khoản bị khóa phải ném ra UnauthorizedException");
    }

    // ===== TEST 4: Cập nhật hồ sơ cá nhân =====
    @Test
    @DisplayName("TC - Test cập nhật hồ sơ cá nhân thành công")
    public void testUpdateProfile() {
        Long userId = 3L;
        User mockUser = new User();
        mockUser.setId(userId);
        mockUser.setName("Tên Cũ");
        mockUser.setEmail("old@test.com");

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        authService.updateProfile(userId, "Tên Mới", "new@test.com", "Địa chỉ mới", null);

        assertEquals("Tên Mới", mockUser.getName(), "Tên phải được cập nhật thành Tên Mới");
    }
}