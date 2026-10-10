package com.carrental.booking.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ApproveBookingRequest {

    @JsonAlias({"note", "owner_note", "ownerNote", "message"})
    String note;
}
