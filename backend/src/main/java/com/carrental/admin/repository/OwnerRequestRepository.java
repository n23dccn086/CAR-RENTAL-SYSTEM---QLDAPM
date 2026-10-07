package com.carrental.admin.repository;

import com.carrental.admin.entity.OwnerRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OwnerRequestRepository extends JpaRepository<OwnerRequest, Long> {

    /** Tìm request mới nhất của 1 user (chưa bị xóa) */
    Optional<OwnerRequest> findFirstByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);

    /** Kiểm tra user có request PENDING nào không */
    boolean existsByUserIdAndStatusAndDeletedAtIsNull(Long userId, String status);

    /** Admin: List theo status */
    List<OwnerRequest> findByStatusAndDeletedAtIsNullOrderByCreatedAtDesc(String status);

    /** Admin: List tất cả (chưa xóa) */
    List<OwnerRequest> findByDeletedAtIsNullOrderByCreatedAtDesc();

    /** Đếm số request PENDING */
    long countByStatusAndDeletedAtIsNull(String status);

    // ★ MỚI: Tìm tất cả request của user theo status
    List<OwnerRequest> findByUserIdAndStatusAndDeletedAtIsNull(Long userId, String status);
}