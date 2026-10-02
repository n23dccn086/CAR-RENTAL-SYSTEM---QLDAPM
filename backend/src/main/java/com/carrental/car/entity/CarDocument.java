package com.carrental.car.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "car_documents", indexes = {
        @Index(name = "idx_car_documents_car", columnList = "car_id"),
        @Index(name = "idx_car_documents_type", columnList = "document_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CarDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", nullable = false)
    Car car;

    @Column(name = "document_type", nullable = false, length = 50)
    String documentType;

    @Column(name = "document_url", nullable = false, length = 500)
    String documentUrl;

    @Column(name = "expiry_date")
    LocalDate expiryDate;

    @Column
    @Builder.Default
    Boolean verified = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;
}