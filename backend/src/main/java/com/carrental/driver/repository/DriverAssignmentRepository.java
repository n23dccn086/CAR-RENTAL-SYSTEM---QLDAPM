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

    Optional<DriverAssignment> findByTokenAndStatus(String token, AssignmentStatus status);

    Optional<DriverAssignment> findByToken(String token);

    List<DriverAssignment> findByBookingIdAndStatus(Long bookingId, AssignmentStatus status);

    List<DriverAssignment> findByBookingIdOrderByCreatedAtDesc(Long bookingId);

    List<DriverAssignment> findByDriverIdAndStatus(Long driverId, AssignmentStatus status);

    List<DriverAssignment> findByStatusAndDeadlineAtBefore(AssignmentStatus status, LocalDateTime deadline);

    long countByBookingId(Long bookingId);

    boolean existsByBookingIdAndDriverIdAndStatus(Long bookingId, Long driverId, AssignmentStatus status);

    // ★ MỚI THÊM: Đếm số assignment của 1 driver (dùng để check FK khi xóa)
    long countByDriverId(Long driverId);
}