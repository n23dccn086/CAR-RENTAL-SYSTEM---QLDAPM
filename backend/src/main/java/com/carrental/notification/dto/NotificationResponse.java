package com.carrental.notification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

/**
 * Response DTO cho thông báo.
 * Trả về client danh sách thông báo của user.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationResponse {

    Long id;
    Long userId;

    String type;           // BOOKING_APPROVED, PAYMENT_SUCCESS, ...
    String title;
    String content;        // nội dung thông báo
    Long referenceId;      // ID tham chiếu (booking_id, payment_id, ...)
    Boolean isRead;

    LocalDateTime createdAt;

    // ===== CONTRACT COMPATIBILITY (snake_case getters & link) =====

    public String getMessage() {
        return content;
    }

    public Boolean getIs_read() {
        return isRead;
    }

    public LocalDateTime getCreated_at() {
        return createdAt;
    }

    public Long getUser_id() {
        return userId;
    }

    public Long getReference_id() {
        return referenceId;
    }

    public String getLink() {
        if (referenceId == null) {
            return null;
        }
        if (type != null) {
            String upper = type.toUpperCase();
            if (upper.contains("DISPUTE")) {
                return "/disputes/" + referenceId;
            }
            if (upper.contains("HANDOVER")) {
                return "/handover/" + referenceId;
            }
            if (upper.contains("PAYMENT") || upper.contains("BOOKING")) {
                return "/bookings/" + referenceId;
            }
            if (upper.contains("CAR")) {
                return "/cars/" + referenceId;
            }
        }
        return "/bookings/" + referenceId;
    }
}