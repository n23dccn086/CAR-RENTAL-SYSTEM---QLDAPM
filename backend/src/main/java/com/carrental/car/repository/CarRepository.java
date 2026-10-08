package com.carrental.car.repository;

import com.carrental.car.entity.Car;
import com.carrental.car.entity.CarStatus;
import com.carrental.car.entity.CarType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarRepository extends JpaRepository<Car, Long> {

    Optional<Car> findByPlate(String plate);

    boolean existsByPlate(String plate);

    List<Car> findByOwnerId(Long ownerId);

    List<Car> findByOwnerIdAndDeletedAtIsNull(Long ownerId);

    List<Car> findByStatus(CarStatus status);

    List<Car> findByStatusAndDeletedAtIsNull(CarStatus status);

    List<Car> findByCarType(CarType carType);

    List<Car> findByStatusAndCarTypeAndDeletedAtIsNull(CarStatus status, CarType carType);

    List<Car> findByStatusAndCarType(CarStatus status, CarType carType);

    // ============================================================
    // PUBLIC: SEARCH XE AVAILABLE VỚI 3 FILTER
    // ============================================================

    @Query(
        value = "SELECT * FROM cars c " +
                "WHERE c.status = 'AVAILABLE' " +
                "AND c.deleted_at IS NULL " +
                "AND (CAST(:location AS text) IS NULL OR LOWER(c.address) LIKE LOWER(CONCAT('%', CAST(:location AS text), '%'))) " +
                "AND c.seats IN (:seats) " +
                "AND (CAST(:carType AS text) IS NULL OR LOWER(c.car_type::text) LIKE LOWER(CONCAT('%', CAST(:carType AS text), '%')))",
        countQuery = "SELECT COUNT(*) FROM cars c " +
                "WHERE c.status = 'AVAILABLE' " +
                "AND c.deleted_at IS NULL " +
                "AND (CAST(:location AS text) IS NULL OR LOWER(c.address) LIKE LOWER(CONCAT('%', CAST(:location AS text), '%'))) " +
                "AND c.seats IN (:seats) " +
                "AND (CAST(:carType AS text) IS NULL OR LOWER(c.car_type::text) LIKE LOWER(CONCAT('%', CAST(:carType AS text), '%')))",
        nativeQuery = true
    )
    Page<Car> searchWithSeats(
            @Param("location") String location,
            @Param("seats") List<Integer> seats,
            @Param("carType") String carType,
            Pageable pageable);

    @Query(
        value = "SELECT * FROM cars c " +
                "WHERE c.status = 'AVAILABLE' " +
                "AND c.deleted_at IS NULL " +
                "AND (CAST(:location AS text) IS NULL OR LOWER(c.address) LIKE LOWER(CONCAT('%', CAST(:location AS text), '%'))) " +
                "AND (CAST(:carType AS text) IS NULL OR LOWER(c.car_type::text) LIKE LOWER(CONCAT('%', CAST(:carType AS text), '%')))",
        countQuery = "SELECT COUNT(*) FROM cars c " +
                "WHERE c.status = 'AVAILABLE' " +
                "AND c.deleted_at IS NULL " +
                "AND (CAST(:location AS text) IS NULL OR LOWER(c.address) LIKE LOWER(CONCAT('%', CAST(:location AS text), '%'))) " +
                "AND (CAST(:carType AS text) IS NULL OR LOWER(c.car_type::text) LIKE LOWER(CONCAT('%', CAST(:carType AS text), '%')))",
        nativeQuery = true
    )
    Page<Car> searchWithoutSeats(
            @Param("location") String location,
            @Param("carType") String carType,
            Pageable pageable);

    // ============================================================
    // ★ OWNER: LẤY XE CỦA MÌNH VỚI FILTER + SEARCH
    // ★ FIX: cast c.status::text để so sánh với :status
    // ============================================================

    @Query(
        value = "SELECT * FROM cars c " +
                "WHERE c.owner_id = :ownerId " +
                "AND c.deleted_at IS NULL " +
                "AND (CAST(:carType AS text) IS NULL OR LOWER(c.car_type::text) LIKE LOWER(CONCAT('%', CAST(:carType AS text), '%'))) " +
                "AND (CAST(:status AS text) IS NULL OR c.status::text = CAST(:status AS text)) " +
                "AND (CAST(:seats AS text) IS NULL OR c.seats IN (:seats)) " +
                "AND (CAST(:search AS text) IS NULL OR " +
                "     LOWER(c.plate) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR " +
                "     LOWER(c.brand) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR " +
                "     LOWER(c.model) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR " +
                "     CAST(c.year AS text) LIKE CONCAT('%', CAST(:search AS text), '%'))",
        countQuery = "SELECT COUNT(*) FROM cars c " +
                "WHERE c.owner_id = :ownerId " +
                "AND c.deleted_at IS NULL " +
                "AND (CAST(:carType AS text) IS NULL OR LOWER(c.car_type::text) LIKE LOWER(CONCAT('%', CAST(:carType AS text), '%'))) " +
                "AND (CAST(:status AS text) IS NULL OR c.status::text = CAST(:status AS text)) " +
                "AND (CAST(:seats AS text) IS NULL OR c.seats IN (:seats)) " +
                "AND (CAST(:search AS text) IS NULL OR " +
                "     LOWER(c.plate) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR " +
                "     LOWER(c.brand) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR " +
                "     LOWER(c.model) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR " +
                "     CAST(c.year AS text) LIKE CONCAT('%', CAST(:search AS text), '%'))",
        nativeQuery = true
    )
    Page<Car> searchOwnerCars(
            @Param("ownerId") Long ownerId,
            @Param("carType") String carType,
            @Param("status") String status,
            @Param("seats") List<Integer> seats,
            @Param("search") String search,
            Pageable pageable);
}