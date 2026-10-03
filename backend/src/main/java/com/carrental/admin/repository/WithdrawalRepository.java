package com.carrental.admin.repository;

import com.carrental.admin.entity.Withdrawal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface WithdrawalRepository extends JpaRepository<Withdrawal, Long> {

    List<Withdrawal> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    List<Withdrawal> findByStatusOrderByCreatedAtDesc(String status);

    long countByStatus(String status);

    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdrawal w " +
           "WHERE w.ownerId = :ownerId AND w.status IN ('PENDING', 'APPROVED', 'PROCESSING')")
    BigDecimal sumPendingAmountByOwner(@Param("ownerId") Long ownerId);
}