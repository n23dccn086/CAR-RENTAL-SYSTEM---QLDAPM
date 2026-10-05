package com.carrental.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO cho tranh chấp.
 * Đã bổ sung đầy đủ 11 field từ V13 + V14.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DisputeResponse {

    Long id;
    String disputeCode;
    Long bookingId;
    Long raisedBy;
    String raisedByName;     
    String raisedByPhone; 
    Long againstUser;
    String againstUserName;   
    String againstUserPhone;

    String category;
    String description;
    String evidence;                    
    BigDecimal claimedAmount;

    String status;
    String resolution;
    BigDecimal resolvedAmount;
    Long resolvedBy;
    LocalDateTime resolvedAt;
    LocalDateTime deadlineAt;

    // ===== MỚI (từ V13) =====
    String adminRequest;
    String evidenceHistory;
    LocalDateTime lastSubmittedAt;

    // ===== MỚI (từ V14) =====
    String counterDescription;
    String counterEvidence;             // JSON string
    LocalDateTime counterFiledAt;
    LocalDateTime counterDeadlineAt;
    LocalDateTime reviewDeadlineAt;
    String awaitingResponseFrom;

    String contractUrl;
    LocalDateTime contractGeneratedAt;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}