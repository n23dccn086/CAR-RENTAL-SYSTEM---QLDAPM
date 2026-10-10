package com.carrental.driver.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DriverAssignRequest {

    @NotNull(message = "driver_id không được để trống")
    @JsonAlias({"driver_id", "driverId"})
    Long driverId;

    @NotNull(message = "booking_id không được để trống")
    @JsonAlias({"booking_id", "bookingId"})
    Long bookingId;

    @JsonAlias({"car_id", "carId"})
    Long carId;
}
