package com.carrental.driver.service;

import com.carrental.driver.entity.DriverAssignment;

import java.util.List;

public interface DriverAssignmentService {

    DriverAssignment assignDriverToBooking(Long bookingId);

    DriverAssignment assignNextDriver(Long bookingId);

    void acceptAssignment(Long assignmentId, String token);

    void rejectAssignment(Long assignmentId, String token, String reason);

    void expireAssignment(Long assignmentId);

    void cancelAssignment(Long assignmentId, Long ownerId);

    DriverAssignment getAssignmentByIdAndToken(Long id, String token);

    List<DriverAssignment> getAssignmentsByBooking(Long bookingId);
}