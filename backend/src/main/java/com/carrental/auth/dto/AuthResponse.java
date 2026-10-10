package com.carrental.auth.dto;

import com.carrental.user.dto.UserDto;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
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

    // Compatibility getters for PDF spec (Page 208, 209, 210)
    @JsonProperty("token")
    public String getToken() {
        return accessToken;
    }

    @JsonProperty("refresh_token")
    public String getRefreshTokenAlias() {
        return refreshToken;
    }

    @JsonProperty("user_id")
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }

    @JsonProperty("role")
    public String getRoleName() {
        return user != null && user.getRole() != null ? user.getRole().name().toLowerCase() : null;
    }

    @JsonProperty("name")
    public String getUserName() {
        return user != null ? user.getName() : null;
    }

    @JsonProperty("phone")
    public String getPhone() {
        return user != null ? user.getPhone() : null;
    }
}