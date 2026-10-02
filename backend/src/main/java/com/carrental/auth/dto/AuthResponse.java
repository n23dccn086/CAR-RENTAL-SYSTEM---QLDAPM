package com.carrental.auth.dto;

import com.carrental.user.dto.UserDto;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    String accessToken;

    String refreshToken;

    @Builder.Default
    String tokenType = "Bearer";

    Long expiresIn;      // Thời gian hết hạn access token (giây)

    UserDto user;
}