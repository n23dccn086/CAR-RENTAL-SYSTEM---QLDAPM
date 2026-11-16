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
import com.carrental.review.entity.ReviewReply;
import com.carrental.review.entity.ReviewReplyAuthorRole;
import com.carrental.review.repository.ReviewReplyRepository;
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
import java.util.Comparator;
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
    ReviewReplyRepository reviewReplyRepository;

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

    // ===== PHẢN HỒI ĐÁNH GIÁ =====
    // Endpoint cũ (Contract 8.3: /reply, /customer-reply) vẫn giữ để không phá API contract,
    // dùng chung các helper bên dưới với luồng hội thoại nhiều lượt (/replies).

    @Override
    @Transactional
    public void replyToReview(Long reviewId, Long ownerId, ReviewReplyRequest request) {
        log.info("Owner {} replying to review {}", ownerId, reviewId);

        Review review = findReview(reviewId);
        if (resolveAuthorRole(review, ownerId) != ReviewReplyAuthorRole.OWNER) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED);
        }

        String reply = request.getReply().trim();
        review.setOwnerReply(reply);
        review.setRepliedAt(LocalDateTime.now());
        reviewRepository.save(review);

        notifyCounterpart(review, ReviewReplyAuthorRole.OWNER, reply);
    }

    @Override
    @Transactional
    public ReviewResponse customerReplyToReview(Long reviewId, Long customerId, ReviewReplyRequest request) {
        log.info("Customer {} replying to owner reply on review {}", customerId, reviewId);

        Review review = findReview(reviewId);
        if (resolveAuthorRole(review, customerId) != ReviewReplyAuthorRole.CUSTOMER) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED);
        }
        requireOwnerReplied(review);

        String reply = request.getReply().trim();
        review.setCustomerReply(reply);
        review.setCustomerRepliedAt(LocalDateTime.now());
        Review saved = reviewRepository.save(review);

        notifyCounterpart(review, ReviewReplyAuthorRole.CUSTOMER, reply);
        return buildResponse(saved);
    }

    // ===== LUỒNG HỘI THOẠI NHIỀU LƯỢT =====

    @Override
    public List<ReviewReplyResponse> getReplies(Long reviewId) {
        Review review = findReview(reviewId);
        return buildThread(review, resolveCustomerName(review), resolveOwnerName(review));
    }

    @Override
    @Transactional
    public List<ReviewReplyResponse> addReply(Long reviewId, Long userId, ReviewThreadReplyRequest request) {
        Review review = findReview(reviewId);

        ReviewReplyAuthorRole role = resolveAuthorRole(review, userId);
        if (role == null) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED);
        }
        if (role == ReviewReplyAuthorRole.CUSTOMER) {
            requireOwnerReplied(review);
        }

        String content = request.getContent().trim();
        log.info("{} {} adds thread reply to review {}", role, userId, reviewId);
        reviewReplyRepository.save(ReviewReply.builder()
                .reviewId(reviewId)
                .authorId(userId)
                .authorRole(role)
                .content(content)
                .build());

        notifyCounterpart(review, role, content);
        return buildThread(review, resolveCustomerName(review), resolveOwnerName(review));
    }

    // ===== HELPER DÙNG CHUNG CHO PHẢN HỒI =====

    private Review findReview(Long reviewId) {
        return reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.REVIEW_NOT_FOUND));
    }

    /** CUSTOMER nếu là người viết đánh giá, OWNER nếu là chủ xe, null nếu không liên quan. */
    private ReviewReplyAuthorRole resolveAuthorRole(Review review, Long userId) {
        if (userId == null) return null;
        if (userId.equals(review.getCustomerId())) return ReviewReplyAuthorRole.CUSTOMER;
        if (userId.equals(review.getOwnerId())) return ReviewReplyAuthorRole.OWNER;
        return null;
    }

    /** Khách chỉ được nhắn khi chủ xe đã phản hồi ít nhất một lần (cột cũ hoặc trong luồng). */
    private void requireOwnerReplied(Review review) {
        boolean ownerHasReplied = (review.getOwnerReply() != null && !review.getOwnerReply().isBlank())
                || reviewReplyRepository.existsByReviewIdAndAuthorRole(review.getId(), ReviewReplyAuthorRole.OWNER);
        if (!ownerHasReplied) {
            throw new BadRequestException(ErrorCode.VALIDATION_ERROR,
                    "Chủ xe chưa phản hồi đánh giá này nên chưa thể trả lời");
        }
    }

    /** Thông báo cho bên còn lại; lỗi thông báo không làm hỏng việc lưu phản hồi. */
    private void notifyCounterpart(Review review, ReviewReplyAuthorRole author, String content) {
        try {
            if (author == ReviewReplyAuthorRole.OWNER) {
                notificationService.createNotification(
                        review.getCustomerId(),
                        NotificationType.REVIEW_REPLY,
                        "Chủ xe đã phản hồi đánh giá",
                        String.format("Chủ xe phản hồi: \"%s\"", content),
                        review.getId());
            } else {
                notificationService.createNotification(
                        review.getOwnerId(),
                        NotificationType.REVIEW_REPLY,
                        "Khách đã trả lời phản hồi của bạn",
                        String.format("Khách trả lời (đơn #%d): \"%s\"", review.getBookingId(), content),
                        review.getId());
            }
        } catch (Exception e) {
            log.warn("Failed to notify review reply (review {}): {}", review.getId(), e.getMessage());
        }
    }

    /**
     * Gộp owner_reply / customer_reply cũ (nếu có) với các tin trong review_replies,
     * sắp xếp theo thời gian tăng dần.
     */
    private List<ReviewReplyResponse> buildThread(Review review, String customerName, String ownerName) {
        List<ReviewReplyResponse> thread = new ArrayList<>();

        if (review.getOwnerReply() != null && !review.getOwnerReply().isBlank()) {
            thread.add(ReviewReplyResponse.builder()
                    .reviewId(review.getId())
                    .authorId(review.getOwnerId())
                    .authorRole(ReviewReplyAuthorRole.OWNER.name())
                    .authorName(ownerName)
                    .content(review.getOwnerReply())
                    .legacy(true)
                    .createdAt(review.getRepliedAt())
                    .build());
        }
        if (review.getCustomerReply() != null && !review.getCustomerReply().isBlank()) {
            thread.add(ReviewReplyResponse.builder()
                    .reviewId(review.getId())
                    .authorId(review.getCustomerId())
                    .authorRole(ReviewReplyAuthorRole.CUSTOMER.name())
                    .authorName(customerName)
                    .content(review.getCustomerReply())
                    .legacy(true)
                    .createdAt(review.getCustomerRepliedAt())
                    .build());
        }

        List<ReviewReply> replies = reviewReplyRepository.findByReviewIdOrderByCreatedAtAscIdAsc(review.getId());
        if (replies != null) {
            for (ReviewReply r : replies) {
                boolean isOwner = r.getAuthorRole() == ReviewReplyAuthorRole.OWNER;
                thread.add(ReviewReplyResponse.builder()
                        .id(r.getId())
                        .reviewId(r.getReviewId())
                        .authorId(r.getAuthorId())
                        .authorRole(r.getAuthorRole().name())
                        .authorName(isOwner ? ownerName : customerName)
                        .content(r.getContent())
                        .legacy(false)
                        .createdAt(r.getCreatedAt())
                        .updatedAt(r.getUpdatedAt())
                        .build());
            }
        }

        // Sắp xếp ổn định theo thời gian; tin thiếu timestamp giữ vị trí đầu (dữ liệu cũ)
        thread.sort(Comparator.comparing(ReviewReplyResponse::getCreatedAt,
                Comparator.nullsFirst(Comparator.naturalOrder())));
        return thread;
    }

    private String resolveCustomerName(Review review) {
        if (Boolean.TRUE.equals(review.getIsAnonymous())) return "Khách ẩn danh";
        if (review.getCustomerId() == null) return null;
        return userRepository.findById(review.getCustomerId()).map(User::getName).orElse(null);
    }

    private String resolveOwnerName(Review review) {
        if (review.getOwnerId() == null) return null;
        return userRepository.findById(review.getOwnerId()).map(User::getName).orElse(null);
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

    @Override
    public List<ReviewResponse> getAllReviews() {
        return reviewRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::buildResponse)
                .toList();
    }

    // ===== DELETE =====

    @Override
    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        log.info("Delete review id: {} by user: {}", reviewId, userId);

        Review review = findReview(reviewId);

        if (!review.getCustomerId().equals(userId)) {
            User user = userRepository.findById(userId).orElse(null);
            boolean isAdmin = user != null && com.carrental.user.entity.Role.ADMIN.equals(user.getRole());
            if (!isAdmin) {
                throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED);
            }
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

        if (review.getOwnerId() != null) {
            User owner = userRepository.findById(review.getOwnerId()).orElse(null);
            if (owner != null) {
                response.setOwnerName(owner.getName());
            }
        }

        response.setImages(review.getImages() != null ? review.getImages() : List.of());
        response.setOwnerReply(review.getOwnerReply());
        response.setDriverRating(review.getDriverRating());
        response.setRepliedAt(review.getRepliedAt());
        response.setCustomerReply(review.getCustomerReply());
        response.setCustomerRepliedAt(review.getCustomerRepliedAt());
        response.setReplies(buildThread(review, response.getCustomerName(), response.getOwnerName()));

        return response;
    }
}