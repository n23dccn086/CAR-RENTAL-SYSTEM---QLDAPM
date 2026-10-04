package com.carrental.driver.repository;

import com.carrental.driver.entity.AssignmentStatus;
import com.carrental.driver.entity.DriverAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DriverAssignmentRepository extends JpaRepository<DriverAssignment, Long> {

    // Tìm assignment đang PENDING theo token
    Optional<DriverAssignment> findByTokenAndStatus(String token, AssignmentStatus status);

    // Tìm tất cả assignment theo token
    Optional<DriverAssignment> findByToken(String token);

    // Tìm assignment PENDING của booking
    List<DriverAssignment> findByBookingIdAndStatus(Long bookingId, AssignmentStatus status);

    // Tìm tất cả assignment của booking (mọi status)
    List<DriverAssignment> findByBookingIdOrderByCreatedAtDesc(Long bookingId);

    // Tìm assignment đang chờ của tài xế
    List<DriverAssignment> findByDriverIdAndStatus(Long driverId, AssignmentStatus status);

    // Tìm assignment PENDING đã hết hạn (cho scheduler)
    List<DriverAssignment> findByStatusAndDeadlineAtBefore(AssignmentStatus status, LocalDateTime deadline);

    // Đếm số lần gán cho booking
    long countByBookingId(Long bookingId);

    // Check tài xế đã được gán cho booking chưa
    boolean existsByBookingIdAndDriverIdAndStatus(Long bookingId, Long driverId, AssignmentStatus status);
}