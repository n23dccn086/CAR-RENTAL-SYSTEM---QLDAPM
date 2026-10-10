package com.carrental.dispute.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DisputeRequest {

    @NotNull(message = "ID đơn hàng không được để trống")
    @JsonAlias({"booking_id", "bookingId"})
    Long bookingId;

    @JsonAlias({"against_user_id", "against_user", "againstUserId", "againstUser"})
    Long againstUserId;

    @NotBlank(message = "Danh mục không được để trống")
    @Size(max = 30, message = "Danh mục không quá 30 ký tự")
    String category;         // damage, late_return, overage_km, no_show, payment, behavior, other

    @NotBlank(message = "Mô tả không được để trống")
    @Size(max = 2000, message = "Mô tả không quá 2000 ký tự")
    String description;

    String evidence;         // JSON string: [{url, note}]

    @JsonAlias({"claimed_amount", "claimedAmount"})
    BigDecimal claimedAmount;  // Số tiền yêu cầu bồi thường
}