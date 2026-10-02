package com.carrental.booking.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BookingDetailResponse {

    Long id;
    Long bookingId;

    Integer rentalDays;
    Long pricePerDay;
    Long rentalFee;

    Long deliveryFee;
    Long insuranceFee;
    Long driverFee;
    Long discount;
    Long extraFee;

    String note;
}