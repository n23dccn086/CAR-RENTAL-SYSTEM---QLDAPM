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

    BookingResponse getBookingById(Long id, Long requesterId);

    Booking getBookingEntityById(Long id);

    List<BookingResponse> getMyBookings(Long customerId);

    List<BookingResponse> getMyBookings(Long customerId, String status);

    List<BookingResponse> getOwnerBookings(Long ownerId);

    List<BookingResponse> getOwnerBookings(Long ownerId, String status);

    // ===== ACTIONS =====

    BookingResponse cancelBooking(Long id, Long customerId, String reason);

    BookingResponse approveBooking(Long id, Long ownerId, String note);

    BookingResponse rejectBooking(Long id, Long ownerId, String reason);

    BookingResponse markAsPaid(Long id);

    BookingResponse startRental(Long id, Long ownerId);

    BookingResponse completeRental(Long id, Long ownerId);

    BookingResponse updateStatus(Long id, Long requesterId, String status, String note);

    // ===== SEARCH =====

    List<BookingResponse> getBookingsByStatus(BookingStatus status);
}