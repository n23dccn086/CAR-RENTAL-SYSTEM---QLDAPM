package com.carrental.review.service;

import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import com.carrental.review.dto.ReviewMapper;
import com.carrental.review.dto.ReviewReplyRequest;
import com.carrental.review.dto.ReviewResponse;
import com.carrental.review.entity.Review;
import com.carrental.review.repository.ReviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewCustomerReplyTest {

    private static final long CUSTOMER_ID = 10L;
    private static final long OWNER_ID = 20L;

    @Mock ReviewRepository reviewRepository;
    @Mock com.carrental.booking.repository.BookingRepository bookingRepository;
    @Mock com.carrental.user.repository.UserRepository userRepository;
    @Mock com.carrental.car.repository.CarRepository carRepository;
    @Mock ReviewMapper reviewMapper;
    @Mock NotificationService notificationService;

    @InjectMocks ReviewServiceImpl reviewService;

    private Review review;

    @BeforeEach
    void setUp() {
        review = Review.builder()
                .id(5L).bookingId(99L).customerId(CUSTOMER_ID).ownerId(OWNER_ID).carId(3L)
                .carRating(2).ownerRating(2).comment("Xe bẩn")
                .ownerReply("Sao bạn đánh giá thấp vậy?").repliedAt(LocalDateTime.now())
                .build();
    }

    private static ReviewReplyRequest req(String text) {
        return ReviewReplyRequest.builder().reply(text).build();
    }

    @Test
    @DisplayName("RV1 - Khách trả lời phản hồi của chủ xe: lưu (đã trim), báo cho chủ xe")
    void customerCanReply() {
        when(reviewRepository.findById(5L)).thenReturn(Optional.of(review));
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> inv.getArgument(0));
        when(reviewMapper.toResponse(any(Review.class))).thenReturn(new ReviewResponse());

        ReviewResponse res = reviewService.customerReplyToReview(5L, CUSTOMER_ID, req("  Xe có mùi thuốc lá  "));

        ArgumentCaptor<Review> saved = ArgumentCaptor.forClass(Review.class);
        verify(reviewRepository).save(saved.capture());
        assertEquals("Xe có mùi thuốc lá", saved.getValue().getCustomerReply());
        assertNotNull(saved.getValue().getCustomerRepliedAt());
        assertEquals("Sao bạn đánh giá thấp vậy?", saved.getValue().getOwnerReply(), "Không được ghi đè phản hồi của chủ xe");

        assertEquals("Xe có mùi thuốc lá", res.getCustomerReply());
        verify(notificationService).createNotification(
                eq(OWNER_ID), eq(NotificationType.REVIEW_REPLY), anyString(), contains("Xe có mùi thuốc lá"), eq(5L));
    }

    @Test
    @DisplayName("RV2 - Người khác (kể cả chủ xe) không được trả lời thay khách")
    void otherUserCannotReply() {
        when(reviewRepository.findById(5L)).thenReturn(Optional.of(review));

        assertThrows(UnauthorizedException.class,
                () -> reviewService.customerReplyToReview(5L, OWNER_ID, req("hack")));
        verify(reviewRepository, never()).save(any());
        verifyNoInteractions(notificationService);
    }

    @Test
    @DisplayName("RV3 - Chủ xe chưa phản hồi thì khách chưa thể trả lời")
    void cannotReplyBeforeOwnerReplied() {
        review.setOwnerReply(null);
        when(reviewRepository.findById(5L)).thenReturn(Optional.of(review));

        assertThrows(BadRequestException.class,
                () -> reviewService.customerReplyToReview(5L, CUSTOMER_ID, req("abc")));

        review.setOwnerReply("   ");
        assertThrows(BadRequestException.class,
                () -> reviewService.customerReplyToReview(5L, CUSTOMER_ID, req("abc")));
        verify(reviewRepository, never()).save(any());
    }
}
