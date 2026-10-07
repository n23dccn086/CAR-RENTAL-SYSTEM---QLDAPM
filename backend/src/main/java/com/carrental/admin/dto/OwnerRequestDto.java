package com.carrental.admin.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

/**
 * DTO nhận yêu cầu đăng ký làm chủ xe từ Customer.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OwnerRequestDto {

    // ===== Bước 1: Thông tin cá nhân =====
    @NotBlank(message = "Họ tên không được để trống")
    @Size(min = 2, max = 100, message = "Họ tên từ 2 đến 100 ký tự")
    String fullName;

    @NotNull(message = "Ngày sinh không được để trống")
    @Past(message = "Ngày sinh phải trong quá khứ")
    LocalDate dateOfBirth;

    @NotBlank(message = "Giới tính không được để trống")
    @Pattern(regexp = "^(MALE|FEMALE|OTHER)$",
             message = "Giới tính phải là MALE, FEMALE hoặc OTHER")
    String gender;

    @NotBlank(message = "Địa chỉ không được để trống")
    @Size(min = 10, max = 255, message = "Địa chỉ từ 10 đến 255 ký tự")
    String address;

    @NotBlank(message = "Số CCCD không được để trống")
    @Pattern(regexp = "^[0-9]{12}$", message = "Số CCCD phải là 12 chữ số")
    String cccd;

    @NotNull(message = "Ngày cấp CCCD không được để trống")
    @PastOrPresent(message = "Ngày cấp CCCD không được trong tương lai")
    LocalDate cccdIssuedDate;

    @NotBlank(message = "Nơi cấp CCCD không được để trống")
    @Size(min = 5, max = 100, message = "Nơi cấp từ 5 đến 100 ký tự")
    String cccdIssuedPlace;

    // ===== Bước 2: Ngân hàng =====
    @NotBlank(message = "Tên ngân hàng không được để trống")
    @Size(max = 100, message = "Tên ngân hàng tối đa 100 ký tự")
    String bankName;

    @NotBlank(message = "Số tài khoản không được để trống")
    @Pattern(regexp = "^[0-9]{8,20}$", message = "Số tài khoản phải từ 8-20 chữ số")
    String bankAccount;

    @NotBlank(message = "Chủ tài khoản không được để trống")
    @Size(max = 100, message = "Chủ tài khoản tối đa 100 ký tự")
    String accountHolder;

    // ===== Bước 4: Điều khoản =====
    @NotNull(message = "Vui lòng đồng ý điều khoản dịch vụ")
    @AssertTrue(message = "Vui lòng đồng ý điều khoản dịch vụ")
    Boolean agreeTerms;

    @NotNull(message = "Vui lòng đồng ý chính sách bảo mật")
    @AssertTrue(message = "Vui lòng đồng ý chính sách bảo mật")
    Boolean agreePrivacy;

    @NotNull(message = "Vui lòng cam kết thông tin chính xác")
    @AssertTrue(message = "Vui lòng cam kết thông tin chính xác")
    Boolean confirmAccuracy;
}