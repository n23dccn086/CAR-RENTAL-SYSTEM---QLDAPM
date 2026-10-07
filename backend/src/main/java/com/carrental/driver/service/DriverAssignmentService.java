package com.carrental.driver.service;

import com.carrental.booking.entity.Booking;
import com.carrental.driver.entity.DriverAssignment;

import java.util.List;

public interface DriverAssignmentService {

    // Auto-assign (tìm driver theo rating) — có thể không dùng nữa
    DriverAssignment assignDriverToBooking(Long bookingId);

    // Assign next driver khi driver hiện tại reject/expire
    DriverAssignment assignNextDriver(Long bookingId);

    // ★ MỚI: Assign driver cụ thể mà KHÁCH đã chọn
    DriverAssignment assignSelectedDriver(Booking booking);

    void acceptAssignment(Long assignmentId, String token);

    void rejectAssignment(Long assignmentId, String token, String reason);

    void expireAssignment(Long assignmentId);

    void cancelAssignment(Long assignmentId, Long ownerId);

    DriverAssignment getAssignmentByIdAndToken(Long id, String token);

    List<DriverAssignment> getAssignmentsByBooking(Long bookingId);
}