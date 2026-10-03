package com.carrental.review.controller;

import com.carrental.common.dto.ApiResponse;
import com.carrental.review.dto.ReviewRequest;
import com.carrental.review.dto.ReviewResponse;
import com.carrental.review.service.ReviewService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ReviewController {

    ReviewService reviewService;

    // ===== CUSTOMER =====

    @PostMapping
    public ApiResponse<ReviewResponse> createReview(
            @RequestAttribute("userId") Long userId,
            @Valid @RequestBody ReviewRequest request) {
        log.info("REST: Create review for booking: {}", request.getBookingId());
        return ApiResponse.success("Đánh giá thành công",
                reviewService.createReview(userId, request));
    }

    @GetMapping("/my")
    public ApiResponse<List<ReviewResponse>> getMyReviews(
            @RequestAttribute("userId") Long userId) {
        return ApiResponse.success(reviewService.getMyReviews(userId));
    }

    @GetMapping("/cars/{carId}")
    public ApiResponse<List<ReviewResponse>> getReviewsByCar(
            @PathVariable Long carId) {
        return ApiResponse.success(reviewService.getReviewsByCar(carId));
    }

    @GetMapping("/owner/{ownerId}")
    public ApiResponse<List<ReviewResponse>> getReviewsByOwner(
            @PathVariable Long ownerId) {
        return ApiResponse.success(reviewService.getReviewsByOwner(ownerId));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteReview(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        reviewService.deleteReview(id, userId);
        return ApiResponse.success("Xóa đánh giá thành công", null);
    }
}