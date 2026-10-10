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

    Page<Car> findByOwnerIdAndStatusAndDeletedAtIsNull(Long ownerId, CarStatus status, Pageable pageable);

    Page<Car> findByOwnerIdAndDeletedAtIsNull(Long ownerId, Pageable pageable);

    // ============================================================
    // PUBLIC: FULL SEARCH WITH CONTRACT FILTERS (3.1)
    // ============================================================

    @Query(
        value = "SELECT * FROM cars c " +
                "WHERE c.status = 'AVAILABLE' " +
                "AND c.deleted_at IS NULL " +
                "AND (CAST(:location AS text) IS NULL OR LOWER(c.address) LIKE LOWER(CONCAT('%', CAST(:location AS text), '%'))) " +
                "AND (CAST(:brand AS text) IS NULL OR LOWER(c.brand) LIKE LOWER(CONCAT('%', CAST(:brand AS text), '%'))) " +
                "AND (CAST(:carType AS text) IS NULL OR LOWER(c.car_type::text) LIKE LOWER(CONCAT('%', CAST(:carType AS text), '%'))) " +
                "AND (CAST(:transmission AS text) IS NULL OR LOWER(c.transmission::text) = LOWER(CAST(:transmission AS text))) " +
                "AND (CAST(:fuelType AS text) IS NULL OR LOWER(c.fuel_type::text) = LOWER(CAST(:fuelType AS text))) " +
                "AND (CAST(:rentalMode AS text) IS NULL OR c.rental_mode::text = 'BOTH' OR LOWER(c.rental_mode::text) = LOWER(CAST(:rentalMode AS text))) " +
                "AND (CAST(:seats AS text) IS NULL OR c.seats IN (:seats)) " +
                "AND (:minPrice IS NULL OR c.price_per_day >= :minPrice) " +
                "AND (:maxPrice IS NULL OR c.price_per_day <= :maxPrice) " +
                "AND (CAST(:startDate AS timestamp) IS NULL OR CAST(:endDate AS timestamp) IS NULL OR NOT EXISTS (" +
                "    SELECT 1 FROM bookings b WHERE b.car_id = c.id " +
                "    AND b.status NOT IN ('CANCELLED', 'COMPLETED') " +
                "    AND b.start_date < CAST(:endDate AS timestamp) AND b.end_date > CAST(:startDate AS timestamp)" +
                ")) " +
                "AND (CAST(:startDate AS timestamp) IS NULL OR CAST(:endDate AS timestamp) IS NULL OR NOT EXISTS (" +
                "    SELECT 1 FROM car_blocked_dates cbd WHERE cbd.car_id = c.id " +
                "    AND cbd.start_date < CAST(:endDate AS date) AND cbd.end_date > CAST(:startDate AS date)" +
                "))",
        countQuery = "SELECT COUNT(*) FROM cars c " +
                "WHERE c.status = 'AVAILABLE' " +
                "AND c.deleted_at IS NULL " +
                "AND (CAST(:location AS text) IS NULL OR LOWER(c.address) LIKE LOWER(CONCAT('%', CAST(:location AS text), '%'))) " +
                "AND (CAST(:brand AS text) IS NULL OR LOWER(c.brand) LIKE LOWER(CONCAT('%', CAST(:brand AS text), '%'))) " +
                "AND (CAST(:carType AS text) IS NULL OR LOWER(c.car_type::text) LIKE LOWER(CONCAT('%', CAST(:carType AS text), '%'))) " +
                "AND (CAST(:transmission AS text) IS NULL OR LOWER(c.transmission::text) = LOWER(CAST(:transmission AS text))) " +
                "AND (CAST(:fuelType AS text) IS NULL OR LOWER(c.fuel_type::text) = LOWER(CAST(:fuelType AS text))) " +
                "AND (CAST(:rentalMode AS text) IS NULL OR c.rental_mode::text = 'BOTH' OR LOWER(c.rental_mode::text) = LOWER(CAST(:rentalMode AS text))) " +
                "AND (CAST(:seats AS text) IS NULL OR c.seats IN (:seats)) " +
                "AND (:minPrice IS NULL OR c.price_per_day >= :minPrice) " +
                "AND (:maxPrice IS NULL OR c.price_per_day <= :maxPrice) " +
                "AND (CAST(:startDate AS timestamp) IS NULL OR CAST(:endDate AS timestamp) IS NULL OR NOT EXISTS (" +
                "    SELECT 1 FROM bookings b WHERE b.car_id = c.id " +
                "    AND b.status NOT IN ('CANCELLED', 'COMPLETED') " +
                "    AND b.start_date < CAST(:endDate AS timestamp) AND b.end_date > CAST(:startDate AS timestamp)" +
                ")) " +
                "AND (CAST(:startDate AS timestamp) IS NULL OR CAST(:endDate AS timestamp) IS NULL OR NOT EXISTS (" +
                "    SELECT 1 FROM car_blocked_dates cbd WHERE cbd.car_id = c.id " +
                "    AND cbd.start_date < CAST(:endDate AS date) AND cbd.end_date > CAST(:startDate AS date)" +
                "))",
        nativeQuery = true
    )
    Page<Car> searchAvailableCarsFull(
            @Param("location") String location,
            @Param("brand") String brand,
            @Param("carType") String carType,
            @Param("transmission") String transmission,
            @Param("fuelType") String fuelType,
            @Param("rentalMode") String rentalMode,
            @Param("seats") List<Integer> seats,
            @Param("minPrice") Long minPrice,
            @Param("maxPrice") Long maxPrice,
            @Param("startDate") java.time.LocalDateTime startDate,
            @Param("endDate") java.time.LocalDateTime endDate,
            Pageable pageable);

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