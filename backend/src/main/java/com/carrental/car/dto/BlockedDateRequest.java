package com.carrental.car.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BlockedDateRequest {

    @NotNull(message = "Ngày bắt đầu không được để trống")
    @JsonAlias({"start_date", "startDate"})
    LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    @JsonAlias({"end_date", "endDate"})
    LocalDate endDate;

    @JsonAlias({"reason"})
    String reason;

    @JsonAlias({"note"})
    String note;
}
