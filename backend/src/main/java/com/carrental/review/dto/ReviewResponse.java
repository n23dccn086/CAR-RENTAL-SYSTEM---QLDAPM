package com.carrental.review.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

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

    String reviewerName;
    String reviewerAvatar;
    String customerName;
    String carName;

    Integer carRating;
    Integer ownerRating;
    Integer driverRating;
    String comment;
    List<String> images;
    String ownerReply;
    LocalDateTime repliedAt;
    Boolean isAnonymous;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    // ===== CONTRACT COMPATIBILITY (snake_case getters) =====

    public Long getBooking_id() {
        return bookingId;
    }

    public Long getCustomer_id() {
        return customerId;
    }

    public Long getCar_id() {
        return carId;
    }

    public Long getOwner_id() {
        return ownerId;
    }

    public String getReviewer_name() {
        return reviewerName;
    }

    public String getReviewer_avatar() {
        return reviewerAvatar;
    }

    public String getCustomer_name() {
        return customerName;
    }

    public String getCar_name() {
        return carName;
    }

    public Integer getCar_rating() {
        return carRating;
    }

    public Integer getOwner_rating() {
        return ownerRating;
    }

    public Integer getDriver_rating() {
        return driverRating;
    }

    public String getOwner_reply() {
        return ownerReply;
    }

    public LocalDateTime getReplied_at() {
        return repliedAt;
    }

    public Boolean getIs_anonymous() {
        return isAnonymous;
    }

    public LocalDateTime getCreated_at() {
        return createdAt;
    }

    public LocalDateTime getUpdated_at() {
        return updatedAt;
    }
}