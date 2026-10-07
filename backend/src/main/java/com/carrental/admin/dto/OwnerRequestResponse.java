package com.carrental.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO cho OwnerRequest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OwnerRequestResponse {

    Long id;
    Long userId;

    // Thông tin User (join)
    String userName;
    String userPhone;
    String userEmail;

    // Bước 1: Thông tin cá nhân
    String fullName;
    LocalDate dateOfBirth;
    String gender;
    String address;
    String cccd;
    LocalDate cccdIssuedDate;
    String cccdIssuedPlace;

    // Bước 2: Ngân hàng
    String bankName;
    String bankAccount;
    String accountHolder;

    // Status
    String status;
    String rejectionReason;
    Long processedBy;
    LocalDateTime processedAt;

    // Ảnh
    List<DocumentInfo> documents;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DocumentInfo {
        Long id;
        String documentType;   // CCCD_FRONT, CCCD_BACK, GPLX_FRONT, GPLX_BACK, SELFIE
        String documentUrl;
        LocalDateTime uploadedAt;
    }
}