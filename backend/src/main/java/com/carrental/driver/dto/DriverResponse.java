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

    String cccd;
    String licenseNumber;
    String licenseClass;

    LocalDate licenseExpiry;
    LocalDate dateOfBirth;
    String address;

    Integer experienceYears;
    String avatarUrl;

    String status;
    Double rating;
    Integer totalTrips;

    // Lý do từ chối
    String rejectionReason;

    // ★ MỚI: Thông tin chủ xe (chỉ Admin cần)
    String ownerName;
    String ownerPhone;
    String ownerAvatarUrl;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    // ===== DUAL COMPATIBILITY GETTERS =====
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