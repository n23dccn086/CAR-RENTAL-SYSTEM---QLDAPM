package com.carrental.admin.dto;

import com.carrental.user.entity.Role;
import com.carrental.user.entity.VerificationStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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

    @com.fasterxml.jackson.annotation.JsonProperty("isActive")
    Boolean isActive;
    LocalDateTime lastLoginAt;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    LocalDateTime deletedAt;

    // ===== MỚI: Danh sách giấy tờ xác thực =====
    List<DocumentInfo> documents;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DocumentInfo {
        Long id;
        String documentType;    // GPLX_FRONT, GPLX_BACK, CCCD_FRONT, CCCD_BACK, SELFIE
        String documentUrl;
        LocalDateTime uploadedAt;
    }
}