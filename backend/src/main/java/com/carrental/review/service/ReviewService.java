package com.carrental.review.service;

import com.carrental.review.dto.ReviewReplyRequest;
import com.carrental.review.dto.ReviewRequest;
import com.carrental.review.dto.ReviewResponse;

import java.util.List;
import java.util.Map;

/**
 * Service xử lý nghiệp vụ đánh giá.
 */
public interface ReviewService {

    // ===== CUSTOMER =====

    ReviewResponse createReview(Long customerId, ReviewRequest request);

    Map<String, Object> getCarReviews(Long carId, int page, int limit);

    void replyToReview(Long reviewId, Long ownerId, ReviewReplyRequest request);

    List<ReviewResponse> getMyReviews(Long customerId);

    List<ReviewResponse> getReviewsByCar(Long carId);

    List<ReviewResponse> getReviewsByOwner(Long ownerId);

    // ===== DELETE =====

    void deleteReview(Long reviewId, Long userId);
}