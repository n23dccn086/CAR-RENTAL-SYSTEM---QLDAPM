package com.carrental.review.service;

import com.carrental.booking.entity.Booking;
import com.carrental.booking.entity.BookingStatus;
import com.carrental.booking.repository.BookingRepository;
import com.carrental.car.entity.Car;
import com.carrental.car.repository.CarRepository;
import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import com.carrental.review.dto.*;
import com.carrental.review.entity.Review;
import com.carrental.review.repository.ReviewRepository;
import com.carrental.user.entity.User;
import com.carrental.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ReviewServiceImpl implements ReviewService {

    ReviewRepository reviewRepository;
    BookingRepository bookingRepository;
    UserRepository userRepository;
    CarRepository carRepository;
    ReviewMapper reviewMapper;
    NotificationService notificationService;

    // ===== CREATE =====

    @Override
    @Transactional
    public ReviewResponse createReview(Long customerId, ReviewRequest request) {
        log.info("Create review for booking: {} by customer: {}", request.getBookingId(), customerId);

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        if (!booking.getCustomerId().equals(customerId)) {
            throw new UnauthorizedException(ErrorCode.BOOKING_NOT_OWNED);
        }

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BadRequestException(ErrorCode.BOOKING_STATUS_INVALID,
                    "Chỉ được đánh giá sau khi chuyến đi hoàn tất");
        }

        if (reviewRepository.existsByBookingId(request.getBookingId())) {
            throw new BadRequestException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        Review review = Review.builder()
                .bookingId(booking.getId())
                .customerId(customerId)
                .carId(booking.getCarId())
                .ownerId(booking.getOwnerId())
                .carRating(request.getCarRating())
                .ownerRating(request.getOwnerRating())
                .driverRating(request.getDriverRating())
                .comment(request.getComment() != null ? request.getComment().trim() : null)
                .images(request.getImages() != null ? request.getImages() : new ArrayList<>())
                .isAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : false)
                .build();

        Review saved = reviewRepository.save(review);
        log.info("Review created with id: {}", saved.getId());

        // ★ Thông báo cho Owner
        try {
            notificationService.createNotification(
                    booking.getOwnerId(),
                    NotificationType.REVIEW_NEW,
                    "Có đánh giá mới",
                    String.format("Khách đã đánh giá đơn #%d. Xe: %d★, Chủ xe: %d★.",
                            booking.getId(),
                            request.getCarRating(),
                            request.getOwnerRating()),
                    saved.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to notify owner: {}", e.getMessage());
        }

        return buildResponse(saved);
    }

    // ===== READ CAR REVIEWS (Contract 8.2) =====

    @Override
    public Map<String, Object> getCarReviews(Long carId, int page, int limit) {
        if (!carRepository.existsById(carId)) {
            throw new ResourceNotFoundException(ErrorCode.CAR_NOT_FOUND);
        }

        int pageIndex = Math.max(0, page - 1);
        int pageSize = Math.max(1, limit);
        Pageable pageable = PageRequest.of(pageIndex, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Review> reviewPage = reviewRepository.findByCarIdOrderByCreatedAtDesc(carId, pageable);
        List<ReviewResponse> reviewResponses = reviewPage.getContent().stream()
                .map(this::buildResponse)
                .toList();

        // Calculate summary
        Double avgRating = reviewRepository.getAverageCarRating(carId);
        double roundedAvg = avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0;
        long total = reviewRepository.countByCarId(carId);

        long star5 = reviewRepository.countByCarIdAndCarRating(carId, 5);
        long star4 = reviewRepository.countByCarIdAndCarRating(carId, 4);
        long star3 = reviewRepository.countByCarIdAndCarRating(carId, 3);
        long star2 = reviewRepository.countByCarIdAndCarRating(carId, 2);
        long star1 = reviewRepository.countByCarIdAndCarRating(carId, 1);

        ReviewSummaryResponse summary = ReviewSummaryResponse.builder()
                .avgRating(roundedAvg)
                .total(total)
                .star5(star5)
                .star4(star4)
                .star3(star3)
                .star2(star2)
                .star1(star1)
                .build();

        Map<String, Object> pagination = new LinkedHashMap<>();
        pagination.put("page", page);
        pagination.put("limit", pageSize);
        pagination.put("total", reviewPage.getTotalElements());
        pagination.put("total_pages", reviewPage.getTotalPages());
        pagination.put("totalPages", reviewPage.getTotalPages());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("reviews", reviewResponses);
        result.put("summary", summary);
        result.put("pagination", pagination);
        result.put("content", reviewResponses);

        return result;
    }

    // ===== OWNER REPLY (Contract 8.3) =====

    @Override
    @Transactional
    public void replyToReview(Long reviewId, Long ownerId, ReviewReplyRequest request) {
        log.info("Owner {} replying to review {}", ownerId, reviewId);

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REVIEW_NOT_FOUND));

        if (!review.getOwnerId().equals(ownerId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED);
        }

        review.setOwnerReply(request.getReply().trim());
        review.setRepliedAt(LocalDateTime.now());
        reviewRepository.save(review);

        // Notify customer
        try {
            notificationService.createNotification(
                    review.getCustomerId(),
                    NotificationType.REVIEW_REPLY,
                    "Chủ xe đã phản hồi đánh giá",
                    String.format("Chủ xe phản hồi: \"%s\"", request.getReply().trim()),
                    review.getId()
            );
        } catch (Exception e) {
            log.warn("Failed to notify customer of review reply: {}", e.getMessage());
        }
    }

    // ===== READ LIST (Legacy / Frontend) =====

    @Override
    public List<ReviewResponse> getMyReviews(Long customerId) {
        List<Review> reviews = reviewRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        return reviews.stream().map(this::buildResponse).toList();
    }

    @Override
    public List<ReviewResponse> getReviewsByCar(Long carId) {
        List<Review> reviews = reviewRepository.findByCarIdOrderByCreatedAtDesc(carId);
        return reviews.stream().map(this::buildResponse).toList();
    }

    @Override
    public List<ReviewResponse> getReviewsByOwner(Long ownerId) {
        List<Review> reviews = reviewRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
        return reviews.stream().map(this::buildResponse).toList();
    }

    // ===== DELETE =====

    @Override
    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        log.info("Delete review id: {} by user: {}", reviewId, userId);

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REVIEW_NOT_FOUND));

        if (!review.getCustomerId().equals(userId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED);
        }

        reviewRepository.delete(review);
        log.info("Review deleted id: {}", reviewId);
    }

    // ===== HELPER =====

    private ReviewResponse buildResponse(Review review) {
        ReviewResponse response = reviewMapper.toResponse(review);

        boolean isAnon = Boolean.TRUE.equals(review.getIsAnonymous());
        if (isAnon) {
            response.setCustomerName("Khách ẩn danh");
            response.setReviewerName("Khách ẩn danh");
            response.setReviewerAvatar(null);
        } else if (review.getCustomerId() != null) {
            User customer = userRepository.findById(review.getCustomerId()).orElse(null);
            if (customer != null) {
                response.setCustomerName(customer.getName());
                response.setReviewerName(customer.getName());
                response.setReviewerAvatar(customer.getAvatarUrl());
            }
        }

        if (review.getCarId() != null) {
            Car car = carRepository.findById(review.getCarId()).orElse(null);
            if (car != null) {
                response.setCarName(car.getBrand() + " " + car.getModel());
            }
        }

        response.setImages(review.getImages() != null ? review.getImages() : List.of());
        response.setOwnerReply(review.getOwnerReply());
        response.setDriverRating(review.getDriverRating());
        response.setRepliedAt(review.getRepliedAt());

        return response;
    }
}