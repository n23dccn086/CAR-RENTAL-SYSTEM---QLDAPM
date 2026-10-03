package com.carrental.handover.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity: Ảnh biên bản giao nhận.
 */
@Entity
@Table(name = "handover_images", indexes = {
        @Index(name = "idx_image_handover", columnList = "handover_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HandoverImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "handover_id", nullable = false)
    Long handoverId;

    @Column(name = "image_url", nullable = false, length = 500)
    String imageUrl;

    @Column(name = "image_type", length = 20)
    @Builder.Default
    String imageType = "OTHER";

    @Column(length = 255)
    String note;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;
}