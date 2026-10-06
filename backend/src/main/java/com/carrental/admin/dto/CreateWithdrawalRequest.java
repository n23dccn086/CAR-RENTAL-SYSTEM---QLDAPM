package com.carrental.admin.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateWithdrawalRequest {

    @NotNull(message = "Số tiền không được để trống")
    @DecimalMin(value = "100000", message = "Số tiền rút tối thiểu 100.000đ")
    @DecimalMax(value = "999999999999", message = "Số tiền quá lớn")
    BigDecimal amount;

    @NotBlank(message = "Tên ngân hàng không được để trống")
    @Size(max = 100, message = "Tên ngân hàng tối đa 100 ký tự")
    String bankName;

    @NotBlank(message = "Số tài khoản không được để trống")
    @Size(max = 50, message = "Số tài khoản tối đa 50 ký tự")
    String bankAccount;

    @NotBlank(message = "Tên chủ tài khoản không được để trống")
    @Size(max = 100, message = "Tên chủ tài khoản tối đa 100 ký tự")
    String accountHolder;
}