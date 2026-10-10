package com.carrental.booking.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateBookingStatusRequest {

    @NotNull(message = "Trạng thái không được để trống")
    @JsonAlias({"status", "target_status", "targetStatus"})
    String status;

    @JsonAlias({"note", "reason", "message"})
    String note;
}
