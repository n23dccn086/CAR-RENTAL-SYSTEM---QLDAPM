package com.carrental.user.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_documents", indexes = {
        @Index(name = "idx_user_docs_user", columnList = "user_id"),
        @Index(name = "idx_user_docs_type", columnList = "document_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "user_id", nullable = false)
    Long userId;

    @Column(name = "document_type", nullable = false, length = 30)
    String documentType;   // GPLX_FRONT, GPLX_BACK, CCCD_FRONT, CCCD_BACK, SELFIE

    @Column(name = "document_url", nullable = false, length = 500)
    String documentUrl;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    LocalDateTime uploadedAt;
}