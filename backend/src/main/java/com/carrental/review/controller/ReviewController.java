package com.carrental.review.controller;

import com.carrental.common.dto.ApiResponse;
import com.carrental.review.dto.ReviewReplyRequest;
import com.carrental.review.dto.ReviewRequest;
import com.carrental.review.dto.ReviewResponse;
import com.carrental.review.service.ReviewService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ReviewController {

    ReviewService reviewService;

    // ===== CONTRACT 8.1: TẠO ĐÁNH GIÁ =====

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReviewResponse> createReview(
            @RequestAttribute("userId") Long userId,
            @Valid @RequestBody ReviewRequest request) {
        log.info("REST: Create review for booking: {}", request.getBookingId());
        return ApiResponse.success("Cảm ơn bạn đã đánh giá",
                reviewService.createReview(userId, request));
    }

    // ===== CONTRACT 8.2 (ALIAS): DANH SÁCH ĐÁNH GIÁ CỦA XE =====

    @GetMapping("/cars/{carId}")
    public ApiResponse<Map<String, Object>> getReviewsByCar(
            @PathVariable Long carId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.success(reviewService.getCarReviews(carId, page, limit));
    }

    // ===== CONTRACT 8.3: CHỦ XE PHẢN HỒI ĐÁNH GIÁ =====

    @PostMapping("/{id}/reply")
    public ApiResponse<Void> replyToReview(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId,
            @Valid @RequestBody ReviewReplyRequest request) {
        log.info("REST: Reply to review id: {}", id);
        reviewService.replyToReview(id, userId, request);
        return ApiResponse.success("Đã phản hồi", null);
    }

    // ===== LEGACY / FRONTEND ENDPOINTS =====

    @GetMapping("/my")
    public ApiResponse<List<ReviewResponse>> getMyReviews(
            @RequestAttribute("userId") Long userId) {
        return ApiResponse.success(reviewService.getMyReviews(userId));
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