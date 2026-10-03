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
}