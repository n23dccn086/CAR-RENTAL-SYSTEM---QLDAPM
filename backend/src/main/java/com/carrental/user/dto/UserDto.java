package com.carrental.user.dto;

import com.carrental.user.entity.Role;
import com.carrental.user.entity.VerificationStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDto {

    Long id;
    String name;
    String phone;
    String email;
    Role role;
    VerificationStatus verificationStatus;

    // ===== MỚI THÊM =====
    String address;
    LocalDate dateOfBirth;
    String avatarUrl;
    Boolean isActive;

    @com.fasterxml.jackson.annotation.JsonProperty("avatar_url")
    public String getAvatarUrlAlias() {
        return avatarUrl;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("verification_status")
    public String getVerificationStatusAlias() {
        return verificationStatus != null ? verificationStatus.name().toLowerCase() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("date_of_birth")
    public LocalDate getDateOfBirthAlias() {
        return dateOfBirth;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("created_at")
    public LocalDateTime getCreatedAtAlias() {
        return createdAt;
    }
    // ====================

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}