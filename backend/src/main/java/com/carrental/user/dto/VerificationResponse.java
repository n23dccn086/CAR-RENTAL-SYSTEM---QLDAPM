package com.carrental.user.dto;

import com.carrental.user.entity.VerificationStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VerificationResponse {

    Long userId;
    String userName;
    String userPhone;
    VerificationStatus status;
    String rejectionReason;
    LocalDateTime submittedAt;
    LocalDateTime verifiedAt;

    // Danh sách ảnh đã upload
    List<DocumentInfo> documents;

    // ===== CONTRACT COMPATIBILITY (snake_case getters) =====

    public String getVerification_status() {
        return status != null ? status.name().toLowerCase() : null;
    }

    public Long getUser_id() {
        return userId;
    }

    public String getUser_name() {
        return userName;
    }

    public String getUser_phone() {
        return userPhone;
    }

    public String getRejection_reason() {
        return rejectionReason;
    }

    public LocalDateTime getSubmitted_at() {
        return submittedAt;
    }

    public LocalDateTime getVerified_at() {
        return verifiedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DocumentInfo {
        Long id;
        String documentType;
        String documentUrl;
        LocalDateTime uploadedAt;

        public String getDoc_type() {
            return documentType != null ? documentType.toLowerCase() : null;
        }

        public String getFile_url() {
            return documentUrl;
        }

        public LocalDateTime getUploaded_at() {
            return uploadedAt;
        }
    }
}