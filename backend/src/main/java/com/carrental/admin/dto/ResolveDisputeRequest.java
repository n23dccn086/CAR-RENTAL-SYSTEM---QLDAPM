package com.carrental.admin.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResolveDisputeRequest {

    @NotBlank(message = "Kết luận phân xử không được để trống")
    String resolution; // customer_wins, owner_wins, split, insufficient_evidence

    @JsonAlias({"resolved_amount", "resolvedAmount"})
    BigDecimal resolvedAmount;

    String note;
}
