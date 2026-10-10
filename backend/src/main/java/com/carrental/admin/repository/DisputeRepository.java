package com.carrental.admin.repository;

import com.carrental.admin.entity.Dispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {

    Optional<Dispute> findByDisputeCode(String disputeCode);

    List<Dispute> findByStatusOrderByCreatedAtDesc(String status);

    List<Dispute> findByRaisedByOrderByCreatedAtDesc(Long raisedBy);

    List<Dispute> findByAgainstUserOrderByCreatedAtDesc(Long againstUser);

    List<Dispute> findByBookingId(Long bookingId);

    long countByStatus(String status);

    /** Tìm dispute có deadline phản bác đã hết hạn */
    List<Dispute> findByStatusAndCounterDeadlineAtBefore(String status, LocalDateTime deadline);

    /** Tìm dispute đang chờ bổ sung và đã hết hạn */
    List<Dispute> findByStatusAndReviewDeadlineAtBefore(String status, LocalDateTime deadline);

    org.springframework.data.domain.Page<Dispute> findByRaisedByOrderByCreatedAtDesc(Long raisedBy, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Dispute> findByRaisedByAndStatusOrderByCreatedAtDesc(Long raisedBy, String status, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Dispute> findByStatusOrderByCreatedAtDesc(String status, org.springframework.data.domain.Pageable pageable);

    org.springframework.data.domain.Page<Dispute> findAllByOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);
}