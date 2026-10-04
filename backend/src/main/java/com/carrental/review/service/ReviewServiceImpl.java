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
import com.carrental.review.dto.ReviewMapper;
import com.carrental.review.dto.ReviewRequest;
import com.carrental.review.dto.ReviewResponse;
import com.carrental.review.entity.Review;
import com.carrental.review.repository.ReviewRepository;
import com.carrental.user.entity.User;
import com.carrental.user.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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

    // ===== CREATE =====

    @Override
    @Transactional
    public ReviewResponse createReview(Long customerId, ReviewRequest request) {
        log.info("Create review for booking: {} by customer: {}", request.getBookingId(), customerId);

        // 1. Check booking tồn tại
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.BOOKING_NOT_FOUND));

        // 2. Check booking thuộc customer
        if (!booking.getCustomerId().equals(customerId)) {
            throw new UnauthorizedException(ErrorCode.BOOKING_NOT_OWNED);
        }

        // 3. Check booking đã hoàn tất
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BadRequestException(ErrorCode.BOOKING_STATUS_INVALID,
                    "Chỉ được đánh giá sau khi chuyến đi hoàn tất");
        }

        // 4. Check đã đánh giá chưa
        if (reviewRepository.existsByBookingId(request.getBookingId())) {
            throw new BadRequestException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        // 5. Tạo Review
        Review review = Review.builder()
                .bookingId(booking.getId())
                .customerId(customerId)
                .carId(booking.getCarId())
                .ownerId(booking.getOwnerId())
                .carRating(request.getCarRating())
                .ownerRating(request.getOwnerRating())
                .comment(request.getComment())
                .isAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : false)
                .build();

        Review saved = reviewRepository.save(review);
        log.info("Review created with id: {}", saved.getId());

        return buildResponse(saved);
    }

    // ===== READ =====

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

        // Chỉ chính chủ review mới được xóa
        if (!review.getCustomerId().equals(userId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED);
        }

        reviewRepository.delete(review);
        log.info("Review deleted id: {}", reviewId);
    }

    // ===== HELPER =====

    /**
     * Build ReviewResponse với customerName + carName.
     * Nếu isAnonymous = true → không set customerName.
     */
    private ReviewResponse buildResponse(Review review) {
        ReviewResponse response = reviewMapper.toResponse(review);

        // Set customerName (chỉ khi không ẩn danh)
        if (review.getIsAnonymous() == null || !review.getIsAnonymous()) {
            if (review.getCustomerId() != null) {
                User customer = userRepository.findById(review.getCustomerId()).orElse(null);
                if (customer != null) {
                    response.setCustomerName(customer.getName());
                }
            }
        }

        // Set carName
        if (review.getCarId() != null) {
            Car car = carRepository.findById(review.getCarId()).orElse(null);
            if (car != null) {
                response.setCarName(car.getBrand() + " " + car.getModel());
            }
        }

        return response;
    }
}