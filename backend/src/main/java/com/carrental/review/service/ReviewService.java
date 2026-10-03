package com.carrental.review.service;

import com.carrental.review.dto.ReviewRequest;
import com.carrental.review.dto.ReviewResponse;

import java.util.List;

/**
 * Service xử lý nghiệp vụ đánh giá.
 */
public interface ReviewService {

    // ===== CUSTOMER =====

    ReviewResponse createReview(Long customerId, ReviewRequest request);

    List<ReviewResponse> getMyReviews(Long customerId);

    List<ReviewResponse> getReviewsByCar(Long carId);

    List<ReviewResponse> getReviewsByOwner(Long ownerId);

    // ===== DELETE =====

    void deleteReview(Long reviewId, Long userId);
}