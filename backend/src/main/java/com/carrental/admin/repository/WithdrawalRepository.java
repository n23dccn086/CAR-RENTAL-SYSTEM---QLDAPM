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

    /**
     * Tổng tiền ĐANG CHỜ rút (chưa chuyển khoản xong).
     * Chỉ tính PENDING / APPROVED / PROCESSING.
     */
    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdrawal w " +
           "WHERE w.ownerId = :ownerId AND w.status IN ('PENDING', 'APPROVED', 'PROCESSING')")
    BigDecimal sumPendingAmountByOwner(@Param("ownerId") Long ownerId);

    /**
     * Tổng tiền ĐÃ RÚT THỰC SỰ (admin đã chuyển khoản — COMPLETED).
     * Dùng để hiển thị "Đã rút" cho chủ xe.
     */
    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdrawal w " +
           "WHERE w.ownerId = :ownerId AND w.status = 'COMPLETED'")
    BigDecimal sumCompletedAmountByOwner(@Param("ownerId") Long ownerId);

    /**
     * Tổng tiền ĐÃ GIỮ CHỖ (đã rút + đang chờ rút).
     * Dùng để tính availableBalance = totalIncome - reserved.
     * Bao gồm: PENDING + APPROVED + PROCESSING + COMPLETED (không tính REJECTED).
     */
    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Withdrawal w " +
           "WHERE w.ownerId = :ownerId " +
           "AND w.status IN ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED')")
    BigDecimal sumReservedAmountByOwner(@Param("ownerId") Long ownerId);
}