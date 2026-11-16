package com.carrental.review.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

/**
 * Một tin trong luồng hội thoại dưới đánh giá.
 * legacy = true: tin lấy từ cột owner_reply / customer_reply cũ của bảng reviews (id = null).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReviewReplyResponse {

    Long id;
    Long reviewId;
    Long authorId;
    String authorRole;
    String authorName;
    String content;
    Boolean legacy;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
