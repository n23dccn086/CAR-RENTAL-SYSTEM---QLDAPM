package com.carrental.review.repository;

import com.carrental.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByCarIdOrderByCreatedAtDesc(Long carId);

    Page<Review> findByCarIdOrderByCreatedAtDesc(Long carId, Pageable pageable);

    List<Review> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    List<Review> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Review> findByBookingId(Long bookingId);

    boolean existsByBookingId(Long bookingId);

    @Query("SELECT AVG(r.carRating) FROM Review r WHERE r.carId = :carId")
    Double getAverageCarRating(@Param("carId") Long carId);

    @Query("SELECT AVG(r.ownerRating) FROM Review r WHERE r.ownerId = :ownerId")
    Double getAverageOwnerRating(@Param("ownerId") Long ownerId);

    long countByCarId(Long carId);

    long countByCarIdAndCarRating(Long carId, Integer carRating);

    // ============================================================
    // ★ MỚI: AVG toàn hệ thống (cho Admin Dashboard CSAT)
    // ============================================================

    @Query("SELECT AVG(r.carRating) FROM Review r")
    Double getAverageCarRatingAll();

    @Query("SELECT AVG(r.ownerRating) FROM Review r")
    Double getAverageOwnerRatingAll();
}