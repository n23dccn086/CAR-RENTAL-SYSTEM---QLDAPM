package com.carrental.admin.repository;

import com.carrental.admin.entity.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {

    Optional<Dispute> findByDisputeCode(String disputeCode);

    List<Dispute> findByStatusOrderByCreatedAtDesc(String status);

    List<Dispute> findByRaisedByOrderByCreatedAtDesc(Long raisedBy);

    List<Dispute> findByBookingId(Long bookingId);

    long countByStatus(String status);
}