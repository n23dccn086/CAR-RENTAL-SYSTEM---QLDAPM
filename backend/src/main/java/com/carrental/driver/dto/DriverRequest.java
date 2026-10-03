package com.carrental.driver.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

/**
 * Request DTO cho tạo/cập nhật tài xế.
 * Dùng cho: POST /drivers, PUT /drivers/:id
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DriverRequest {

    @NotBlank(message = "Tên tài xế không được để trống")
    @Size(min = 2, max = 100, message = "Tên tài xế từ 2 đến 100 ký tự")
    String name;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9]{10,11}$", message = "Số điện thoại phải 10-11 số")
    String phone;

    @Email(message = "Email không đúng định dạng")
    @Size(max = 150, message = "Email tối đa 150 ký tự")
    String email;

    @Pattern(regexp = "^[0-9]{12}$", message = "Số CCCD phải 12 số")
    String cccd;

    @NotBlank(message = "Số GPLX không được để trống")
    @Size(max = 30, message = "Số GPLX tối đa 30 ký tự")
    String licenseNumber;

    @NotBlank(message = "Hạng GPLX không được để trống")
    @Pattern(regexp = "^(B1|B2|C|D|E)$", message = "Hạng GPLX phải là B1, B2, C, D hoặc E")
    String licenseClass;

    LocalDate licenseExpiry;

    LocalDate dateOfBirth;

    @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
    String address;

    @Min(value = 0, message = "Số năm kinh nghiệm không được âm")
    @Max(value = 50, message = "Số năm kinh nghiệm tối đa 50")
    Integer experienceYears;

    @Size(max = 500, message = "URL avatar tối đa 500 ký tự")
    String avatarUrl;
}