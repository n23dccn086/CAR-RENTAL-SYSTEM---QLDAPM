package com.carrental.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResetPasswordRequest {

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9]{10,11}$", message = "Số điện thoại phải 10-11 chữ số")
    String phone;

    @NotBlank(message = "Mã OTP không được để trống")
    @Pattern(regexp = "^[0-9]{6}$", message = "OTP phải 6 chữ số")
    String otp;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 8, max = 100, message = "Mật khẩu phải từ 8 đến 100 ký tự")
    @com.fasterxml.jackson.annotation.JsonAlias({"new_password", "newPassword"})
    String newPassword;
}