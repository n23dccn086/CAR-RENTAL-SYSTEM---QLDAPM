package com.carrental.booking.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RejectBookingRequest {

    @JsonAlias({"reason", "reject_reason", "rejectReason", "note"})
    String reason;
}
