package com.carrental.review.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews", indexes = {
        @Index(name = "idx_reviews_booking", columnList = "booking_id"),
        @Index(name = "idx_reviews_customer", columnList = "customer_id"),
        @Index(name = "idx_reviews_car", columnList = "car_id"),
        @Index(name = "idx_reviews_owner", columnList = "owner_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "booking_id", nullable = false)
    Long bookingId;

    @Column(name = "customer_id", nullable = false)
    Long customerId;

    @Column(name = "car_id", nullable = false)
    Long carId;

    @Column(name = "owner_id", nullable = false)
    Long ownerId;

    @Column(name = "car_rating", nullable = false)
    Integer carRating;

    @Column(name = "owner_rating", nullable = false)
    Integer ownerRating;

    @Column(name = "driver_rating")
    Integer driverRating;

    @Column(columnDefinition = "TEXT")
    String comment;

    @Convert(converter = com.carrental.common.util.StringListJsonConverter.class)
    @Column(name = "images", columnDefinition = "TEXT")
    @Builder.Default
    java.util.List<String> images = new java.util.ArrayList<>();

    @Column(name = "owner_reply", columnDefinition = "TEXT")
    String ownerReply;

    @Column(name = "replied_at")
    LocalDateTime repliedAt;

    @Column(name = "is_anonymous")
    @Builder.Default
    Boolean isAnonymous = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
}