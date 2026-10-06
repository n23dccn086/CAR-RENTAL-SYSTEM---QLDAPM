package com.carrental.handover.repository;

import com.carrental.handover.entity.HandoverRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface HandoverRecordRepository extends JpaRepository<HandoverRecord, Long> {

    List<HandoverRecord> findByBookingId(Long bookingId);

    Optional<HandoverRecord> findByBookingIdAndHandoverType(Long bookingId, String handoverType);

    boolean existsByBookingIdAndHandoverType(Long bookingId, String handoverType);

    /**
     * Lấy handover RETURN của booking (dùng để hiển thị phí ở MyBookings/OwnerBookings).
     */
    @Query("SELECT h FROM HandoverRecord h " +
           "WHERE h.bookingId = :bookingId AND h.handoverType = 'RETURN'")
    Optional<HandoverRecord> findReturnHandoverByBookingId(@Param("bookingId") Long bookingId);

    /**
     * Tính tổng phí trả muộn cho 1 booking.
     */
    @Query("SELECT COALESCE(h.lateFee, 0) FROM HandoverRecord h " +
           "WHERE h.bookingId = :bookingId AND h.handoverType = 'RETURN'")
    BigDecimal findLateFeeByBookingId(@Param("bookingId") Long bookingId);

    /**
     * Tính tổng phí phát sinh cho 1 booking.
     */
    @Query("SELECT COALESCE(h.extraFees, 0) FROM HandoverRecord h " +
           "WHERE h.bookingId = :bookingId AND h.handoverType = 'RETURN'")
    BigDecimal findExtraFeesByBookingId(@Param("bookingId") Long bookingId);
}