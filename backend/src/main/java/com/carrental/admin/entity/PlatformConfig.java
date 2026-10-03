package com.carrental.admin.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity: Cấu hình nền tảng (key-value).
 */
@Entity
@Table(name = "platform_config", indexes = {
        @Index(name = "idx_config_key", columnList = "config_key")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PlatformConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "config_key", nullable = false, unique = true, length = 100)
    String configKey;

    @Column(name = "config_value", nullable = false, columnDefinition = "TEXT")
    String configValue;

    @Column(name = "config_type", nullable = false, length = 20)
    @Builder.Default
    String configType = "STRING";  // STRING, NUMBER, BOOLEAN, JSON

    @Column(length = 255)
    String description;

    @Column(name = "updated_by")
    Long updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
}