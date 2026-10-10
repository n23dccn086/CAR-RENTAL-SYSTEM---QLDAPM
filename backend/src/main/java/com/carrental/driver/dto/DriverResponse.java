package com.carrental.driver.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO cho tài xế.
 * Trả về client các thông tin cần thiết (không expose dữ liệu nhạy cảm).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DriverResponse {

    Long id;
    Long ownerId;

    String name;
    String phone;
    String email;

    String cccd;             // có thể che 3 số cuối ở service
    String licenseNumber;
    String licenseClass;

    LocalDate licenseExpiry;
    LocalDate dateOfBirth;
    String address;

    Integer experienceYears;
    String avatarUrl;

    String status;           // PENDING / AVAILABLE / BUSY / OFF / REJECTED
    Double rating;
    Integer totalTrips;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    // ===== DUAL COMPATIBILITY GETTERS (Contract snake_case) =====
    public String getGplx_class() { return licenseClass; }
    public String getGplx_number() { return licenseNumber; }
    public String getCccd_number() { return cccd; }
    public LocalDate getGplx_expiry_date() { return licenseExpiry; }
    public LocalDate getDate_of_birth() { return dateOfBirth; }
    public Integer getExperience_years() { return experienceYears; }
    public String getAvatar_url() { return avatarUrl; }
    public Double getAvg_rating() { return rating != null ? rating : 5.0; }
    public Integer getTotal_trips() { return totalTrips != null ? totalTrips : 0; }
    public LocalDateTime getCreated_at() { return createdAt; }
    public LocalDateTime getUpdated_at() { return updatedAt; }
}