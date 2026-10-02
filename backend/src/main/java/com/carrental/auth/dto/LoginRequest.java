package com.carrental.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoginRequest {

    @NotBlank(message = "Số điện thoại không được để trống")
    String phone;

    @NotBlank(message = "Mật khẩu không được để trống")
    String password;
}