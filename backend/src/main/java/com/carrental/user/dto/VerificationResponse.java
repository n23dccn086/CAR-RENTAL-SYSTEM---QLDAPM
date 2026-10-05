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
    }
}