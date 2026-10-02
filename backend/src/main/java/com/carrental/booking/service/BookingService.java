package com.carrental.booking.service;

import com.carrental.booking.dto.BookingRequest;
import com.carrental.booking.dto.BookingResponse;
import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;

import java.util.List;

public interface BookingService {

    // ===== CRUD =====

    BookingResponse createBooking(Long customerId, BookingRequest request);

    BookingResponse getBookingById(Long id);

    Booking getBookingEntityById(Long id);

    List<BookingResponse> getMyBookings(Long customerId);

    List<BookingResponse> getOwnerBookings(Long ownerId);

    // ===== ACTIONS =====

    BookingResponse cancelBooking(Long id, Long customerId, String reason);

    BookingResponse approveBooking(Long id, Long ownerId, String note);

    BookingResponse rejectBooking(Long id, Long ownerId, String reason);

    BookingResponse markAsPaid(Long id);

    BookingResponse startRental(Long id, Long ownerId);

    BookingResponse completeRental(Long id, Long ownerId);

    // ===== SEARCH =====

    List<BookingResponse> getBookingsByStatus(BookingStatus status);
}