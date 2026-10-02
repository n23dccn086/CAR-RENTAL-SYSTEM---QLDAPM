package com.carrental.review.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReviewResponse {

    Long id;
    Long bookingId;
    Long customerId;
    Long carId;
    Long ownerId;

    String customerName;
    String carName;

    Integer carRating;
    Integer ownerRating;
    String comment;
    Boolean isAnonymous;

    LocalDateTime createdAt;
}