package com.carrental.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReviewRequest {

    @NotNull(message = "ID booking không được để trống")
    Long bookingId;

    @NotNull(message = "Đánh giá xe không được để trống")
    @Min(value = 1, message = "Đánh giá tối thiểu 1 sao")
    @Max(value = 5, message = "Đánh giá tối đa 5 sao")
    Integer carRating;

    @NotNull(message = "Đánh giá chủ xe không được để trống")
    @Min(value = 1, message = "Đánh giá tối thiểu 1 sao")
    @Max(value = 5, message = "Đánh giá tối đa 5 sao")
    Integer ownerRating;

    @Size(max = 1000, message = "Nhận xét không quá 1000 ký tự")
    String comment;

    Boolean isAnonymous;
}