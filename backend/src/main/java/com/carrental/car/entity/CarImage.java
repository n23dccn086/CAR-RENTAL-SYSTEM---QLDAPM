package com.carrental.car.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "car_images", indexes = {
        @Index(name = "idx_car_images_car", columnList = "car_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CarImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "car_id", nullable = false)
    Long carId;

    @Column(name = "image_url", nullable = false, length = 500)
    String imageUrl;

    @Column(name = "image_type", length = 20)
    @Builder.Default
    String imageType = "OTHER";

    @Column(name = "display_order")
    @Builder.Default
    Integer displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;
}