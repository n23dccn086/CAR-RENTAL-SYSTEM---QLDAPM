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

    // ===== DUAL COMPATIBILITY GETTERS (Contract snake_case) =====
    public String getDispute_code() { return disputeCode; }
    public Long getBooking_id() { return bookingId; }
    public Long getRaised_by() { return raisedBy; }
    public String getRaised_by_name() { return raisedByName; }
    public Long getAgainst_user() { return againstUser; }
    public Long getAgainst_user_id() { return againstUser; }
    public String getAgainst_user_name() { return againstUserName; }
    public BigDecimal getClaimed_amount() { return claimedAmount; }
    public BigDecimal getResolved_amount() { return resolvedAmount; }
    public LocalDateTime getDeadline_at() { return deadlineAt != null ? deadlineAt : counterDeadlineAt; }
    public LocalDateTime getCreated_at() { return createdAt; }
    public LocalDateTime getUpdated_at() { return updatedAt; }
}