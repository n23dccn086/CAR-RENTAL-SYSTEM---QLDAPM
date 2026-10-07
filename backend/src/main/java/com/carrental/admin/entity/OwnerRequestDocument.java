package com.carrental.admin.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "owner_request_documents", indexes = {
        @Index(name = "idx_owner_doc_req", columnList = "request_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OwnerRequestDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "request_id", nullable = false)
    Long requestId;

    @Column(name = "document_type", nullable = false, length = 30)
    String documentType;   // CCCD_FRONT, CCCD_BACK, GPLX_FRONT, GPLX_BACK, SELFIE

    @Column(name = "document_url", nullable = false, length = 500)
    String documentUrl;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    LocalDateTime uploadedAt;
}