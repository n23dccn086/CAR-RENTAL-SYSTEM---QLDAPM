package com.carrental.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO cho tranh chấp.
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
    Long againstUser;

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

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}