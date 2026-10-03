package com.carrental.admin.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WithdrawalResponse {

    Long id;
    Long ownerId;
    BigDecimal amount;

    String bankName;
    String bankAccount;
    String accountHolder;

    String status;
    String rejectReason;
    Long processedBy;
    LocalDateTime processedAt;
    String transactionId;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}