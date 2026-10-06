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

    /** Số tiền YÊU CẦU rút */
    BigDecimal amount;

    /** Phí rút tiền */
    BigDecimal fee;

    /** Số tiền THỰC NHẬN = amount - fee */
    BigDecimal netAmount;

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