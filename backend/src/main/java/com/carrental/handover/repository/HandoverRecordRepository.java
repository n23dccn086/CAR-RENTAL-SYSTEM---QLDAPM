package com.carrental.handover.repository;

import com.carrental.handover.entity.HandoverRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HandoverRecordRepository extends JpaRepository<HandoverRecord, Long> {

    List<HandoverRecord> findByBookingId(Long bookingId);

    Optional<HandoverRecord> findByBookingIdAndHandoverType(Long bookingId, String handoverType);

    boolean existsByBookingIdAndHandoverType(Long bookingId, String handoverType);
}