package com.carrental.driver.repository;

import com.carrental.driver.entity.Driver;
import com.carrental.driver.entity.DriverStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {

    Optional<Driver> findByPhone(String phone);

    boolean existsByPhone(String phone);

    List<Driver> findByOwnerIdAndDeletedAtIsNull(Long ownerId);

    List<Driver> findByOwnerIdAndStatusAndDeletedAtIsNull(Long ownerId, DriverStatus status);

    List<Driver> findByStatusAndDeletedAtIsNull(DriverStatus status);

    List<Driver> findByOwnerId(Long ownerId);

    List<Driver> findByStatus(DriverStatus status);

    long countByStatusAndDeletedAtIsNull(DriverStatus status);

    // ============================================================
    // ★ OWNER — SEARCH + FILTER + SORT + PHÂN TRANG
    // ============================================================
    /**
     * Search tài xế của owner với:
     * - filter status (exact)
     * - search text (tên, SĐT, GPLX)
     */
    @Query(
        value = "SELECT * FROM drivers d " +
                "WHERE d.owner_id = :ownerId " +
                "AND d.deleted_at IS NULL " +
                "AND (CAST(:status AS text) IS NULL OR d.status::text = CAST(:status AS text)) " +
                "AND (CAST(:search AS text) IS NULL OR " +
                "     LOWER(d.name) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR " +
                "     d.phone LIKE CONCAT('%', CAST(:search AS text), '%') OR " +
                "     LOWER(d.license_number) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))",
        countQuery = "SELECT COUNT(*) FROM drivers d " +
                "WHERE d.owner_id = :ownerId " +
                "AND d.deleted_at IS NULL " +
                "AND (CAST(:status AS text) IS NULL OR d.status::text = CAST(:status AS text)) " +
                "AND (CAST(:search AS text) IS NULL OR " +
                "     LOWER(d.name) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR " +
                "     d.phone LIKE CONCAT('%', CAST(:search AS text), '%') OR " +
                "     LOWER(d.license_number) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))",
        nativeQuery = true
    )
    Page<Driver> searchOwnerDrivers(
            @Param("ownerId") Long ownerId,
            @Param("status") String status,
            @Param("search") String search,
            Pageable pageable);
}