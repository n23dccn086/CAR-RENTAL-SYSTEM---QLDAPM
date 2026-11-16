package com.carrental.review.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Một tin nhắn trong luồng hội thoại giữa khách và chủ xe dưới một đánh giá.
 */
@Entity
@Table(name = "review_replies", indexes = {
        @Index(name = "idx_review_replies_review", columnList = "review_id, created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReviewReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "review_id", nullable = false)
    Long reviewId;

    @Column(name = "author_id", nullable = false)
    Long authorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "author_role", nullable = false, length = 20)
    ReviewReplyAuthorRole authorRole;

    @Column(nullable = false, columnDefinition = "TEXT")
    String content;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
}
