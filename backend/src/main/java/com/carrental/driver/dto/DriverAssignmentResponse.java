package com.carrental.driver.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DriverAssignmentResponse {

    Long id;
    Long bookingId;
    Long driverId;
    String driverName;
    String driverPhone;
    String token;
    String status;
    String rejectReason;
    LocalDateTime deadlineAt;
    LocalDateTime respondedAt;
    Integer attemptNumber;

    // Thông tin booking
    String carName;
    String carPlate;
    LocalDateTime startDate;
    LocalDateTime endDate;
    String pickupAddress;
    String customerName;

    LocalDateTime createdAt;

    public Long getAssignment_id() { return id; }
    public Long getDriver_id() { return driverId; }
    public Long getBooking_id() { return bookingId; }
}