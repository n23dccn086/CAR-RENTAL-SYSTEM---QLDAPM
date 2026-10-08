package com.carrental.booking.repository;

import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Booking> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    List<Booking> findByCarIdAndStatusIn(Long carId, List<BookingStatus> statuses);

    List<Booking> findByStatus(BookingStatus status);

    /**
     * Kiểm tra xe đã có booking trong khoảng thời gian chưa.
     * Trạng thái không tính: CANCELLED, COMPLETED.
     */
    @Query("""
            SELECT COUNT(b) > 0 FROM Booking b
            WHERE b.carId = :carId
            AND b.status NOT IN ('CANCELLED', 'COMPLETED')
            AND b.startDate < :endDate
            AND b.endDate > :startDate
            """)
    boolean existsActiveBooking(
            @Param("carId") Long carId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    long countByCarIdAndStatusIn(Long carId, List<BookingStatus> statuses);

    /**
     * Kiểm tra tài xế có booking đang active chồng lấn thời gian không.
     */
    @Query("""
            SELECT COUNT(b) > 0 FROM Booking b
            WHERE b.driverId = :driverId
            AND b.status NOT IN ('CANCELLED', 'COMPLETED')
            AND b.startDate < :endDate
            AND b.endDate > :startDate
            """)
    boolean existsByDriverIdAndTimeOverlap(
            @Param("driverId") Long driverId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT COUNT(b) FROM Booking b " +
            "WHERE b.carId = :carId AND b.status = com.carrental.booking.entity.BookingStatus.COMPLETED")
    long countCompletedByCarId(@Param("carId") Long carId);

    /**
     * ★ MỚI: Tìm booking theo status + created_at < cutoff.
     * Dùng cho scheduler tự hủy đơn PENDING quá hạn.
     */
    List<Booking> findByStatusAndCreatedAtBefore(BookingStatus status, LocalDateTime cutoff);
}