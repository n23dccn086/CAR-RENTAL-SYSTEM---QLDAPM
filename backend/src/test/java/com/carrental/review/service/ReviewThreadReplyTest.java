package com.carrental.review.service;

import com.carrental.common.exception.BadRequestException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import com.carrental.review.dto.ReviewMapper;
import com.carrental.review.dto.ReviewReplyResponse;
import com.carrental.review.dto.ReviewThreadReplyRequest;
import com.carrental.review.entity.Review;
import com.carrental.review.entity.ReviewReply;
import com.carrental.review.entity.ReviewReplyAuthorRole;
import com.carrental.review.repository.ReviewReplyRepository;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Luồng hội thoại nhiều lượt khách <-> chủ xe dưới đánh giá (POST /reviews/{id}/replies). */
@ExtendWith(MockitoExtension.class)
class ReviewThreadReplyTest {

    private static final long CUSTOMER_ID = 10L;
    private static final long OWNER_ID = 20L;

    @Mock ReviewRepository reviewRepository;
    @Mock com.carrental.booking.repository.BookingRepository bookingRepository;
    @Mock com.carrental.user.repository.UserRepository userRepository;
    @Mock com.carrental.car.repository.CarRepository carRepository;
    @Mock ReviewMapper reviewMapper;
    @Mock NotificationService notificationService;
    @Mock ReviewReplyRepository reviewReplyRepository;

    @InjectMocks ReviewServiceImpl reviewService;

    private Review review;

    @BeforeEach
    void setUp() {
        // Chưa có owner_reply cũ → quy tắc "chủ xe phản hồi trước" phải dựa vào bảng review_replies
        review = Review.builder()
                .id(5L).bookingId(99L).customerId(CUSTOMER_ID).ownerId(OWNER_ID).carId(3L)
                .carRating(4).ownerRating(5).comment("Ổn")
                .build();
        lenient().when(reviewRepository.findById(5L)).thenReturn(Optional.of(review));
        lenient().when(userRepository.findById(anyLong())).thenReturn(Optional.empty());
        lenient().when(reviewReplyRepository.findByReviewIdOrderByCreatedAtAscIdAsc(5L)).thenReturn(List.of());
    }

    private static ReviewThreadReplyRequest req(String text) {
        return ReviewThreadReplyRequest.builder().content(text).build();
    }

    @Test
    @DisplayName("TH1 - Chủ xe nhắn: lưu với role OWNER (đã trim), báo cho khách")
    void ownerCanReply() {
        reviewService.addReply(5L, OWNER_ID, req("  Cảm ơn bạn  "));

        ArgumentCaptor<ReviewReply> saved = ArgumentCaptor.forClass(ReviewReply.class);
        verify(reviewReplyRepository).save(saved.capture());
        assertEquals(ReviewReplyAuthorRole.OWNER, saved.getValue().getAuthorRole());
        assertEquals(OWNER_ID, saved.getValue().getAuthorId());
        assertEquals("Cảm ơn bạn", saved.getValue().getContent());
        verify(notificationService).createNotification(
                eq(CUSTOMER_ID), eq(NotificationType.REVIEW_REPLY), anyString(), contains("Cảm ơn bạn"), eq(5L));
    }

    @Test
    @DisplayName("TH2 - Khách nhắn khi chủ xe chưa phản hồi lần nào → 400, không lưu")
    void customerBlockedBeforeOwnerReplied() {
        when(reviewReplyRepository.existsByReviewIdAndAuthorRole(5L, ReviewReplyAuthorRole.OWNER)).thenReturn(false);

        assertThrows(BadRequestException.class, () -> reviewService.addReply(5L, CUSTOMER_ID, req("Alo")));
        verify(reviewReplyRepository, never()).save(any());
        verifyNoInteractions(notificationService);
    }

    @Test
    @DisplayName("TH3 - Khách nhắn sau khi chủ xe đã nhắn trong luồng → lưu role CUSTOMER, báo cho chủ xe")
    void customerAllowedAfterOwnerThreadReply() {
        when(reviewReplyRepository.existsByReviewIdAndAuthorRole(5L, ReviewReplyAuthorRole.OWNER)).thenReturn(true);

        reviewService.addReply(5L, CUSTOMER_ID, req("Dạ ổn ạ"));

        ArgumentCaptor<ReviewReply> saved = ArgumentCaptor.forClass(ReviewReply.class);
        verify(reviewReplyRepository).save(saved.capture());
        assertEquals(ReviewReplyAuthorRole.CUSTOMER, saved.getValue().getAuthorRole());
        verify(notificationService).createNotification(
                eq(OWNER_ID), eq(NotificationType.REVIEW_REPLY), anyString(), contains("Dạ ổn ạ"), eq(5L));
    }

    @Test
    @DisplayName("TH4 - Người ngoài (không phải khách / chủ xe) → 403, không lưu")
    void outsiderBlocked() {
        assertThrows(UnauthorizedException.class, () -> reviewService.addReply(5L, 777L, req("spam")));
        verify(reviewReplyRepository, never()).save(any());
        verifyNoInteractions(notificationService);
    }

    @Test
    @DisplayName("TH5 - Review cũ thiếu ownerId: người ngoài vẫn bị chặn 403, không NPE")
    void nullOwnerIdDoesNotCrash() {
        review.setOwnerId(null);
        assertThrows(UnauthorizedException.class, () -> reviewService.addReply(5L, 777L, req("x")));
    }

    @Test
    @DisplayName("TH6 - Luồng gộp tin cũ (owner_reply/customer_reply) + tin mới, sắp theo thời gian")
    void threadMergesLegacyAndNewInOrder() {
        LocalDateTime t0 = LocalDateTime.of(2026, 11, 14, 7, 0);
        review.setOwnerReply("xe ổn không bạn");
        review.setRepliedAt(t0);
        review.setCustomerReply("dạ ổn");
        review.setCustomerRepliedAt(t0.plusMinutes(1));
        ReviewReply later = ReviewReply.builder().id(1L).reviewId(5L).authorId(OWNER_ID)
                .authorRole(ReviewReplyAuthorRole.OWNER).content("cảm ơn").createdAt(t0.plusMinutes(5)).build();
        when(reviewReplyRepository.findByReviewIdOrderByCreatedAtAscIdAsc(5L)).thenReturn(List.of(later));

        List<ReviewReplyResponse> thread = reviewService.getReplies(5L);

        assertEquals(List.of("xe ổn không bạn", "dạ ổn", "cảm ơn"),
                thread.stream().map(ReviewReplyResponse::getContent).toList());
        assertEquals(List.of("OWNER", "CUSTOMER", "OWNER"),
                thread.stream().map(ReviewReplyResponse::getAuthorRole).toList());
        assertTrue(thread.get(0).getLegacy());
        assertFalse(thread.get(2).getLegacy());
    }
}
