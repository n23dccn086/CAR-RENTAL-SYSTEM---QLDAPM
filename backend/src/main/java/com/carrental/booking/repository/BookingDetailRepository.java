package com.carrental.booking.repository;

import com.carrental.booking.entity.BookingDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookingDetailRepository extends JpaRepository<BookingDetail, Long> {

    Optional<BookingDetail> findByBookingId(Long bookingId);

    void deleteByBookingId(Long bookingId);
}