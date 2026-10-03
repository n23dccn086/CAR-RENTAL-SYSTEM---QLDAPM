package com.carrental.admin.dto;

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
public class AdminUserResponse {

    Long id;
    String name;
    String phone;
    String email;
    String avatarUrl;

    Role role;
    VerificationStatus verificationStatus;
    String rejectionReason;

    String address;
    LocalDate dateOfBirth;

    Boolean isActive;
    LocalDateTime lastLoginAt;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    LocalDateTime deletedAt;
}