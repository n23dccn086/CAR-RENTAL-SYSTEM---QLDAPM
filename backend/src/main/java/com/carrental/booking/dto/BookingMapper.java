package com.carrental.booking.dto;

import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingDetail;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface BookingMapper {

    BookingResponse toResponse(Booking booking);

    List<BookingResponse> toResponseList(List<Booking> bookings);

    BookingDetailResponse toDetailResponse(BookingDetail detail);
}