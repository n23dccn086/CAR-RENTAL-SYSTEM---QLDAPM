package com.carrental.notification.controller;

import com.carrental.common.dto.ApiResponse;
import com.carrental.notification.dto.NotificationResponse;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.service.NotificationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class NotificationController {

    NotificationService notificationService;

    // ===== READ =====

    /**
     * Lấy danh sách thông báo của tôi.
     * GET /api/v1/notifications
     */
    @GetMapping
    public ApiResponse<List<NotificationResponse>> getMyNotifications(
            @RequestAttribute("userId") Long userId,
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false) Boolean unreadOnly) {

        if (Boolean.TRUE.equals(unreadOnly)) {
            return ApiResponse.success(
                    notificationService.getMyUnreadNotifications(userId));
        }

        if (type != null) {
            return ApiResponse.success(
                    notificationService.getMyNotificationsByType(userId, type));
        }

        return ApiResponse.success(notificationService.getMyNotifications(userId));
    }

    /**
     * Đếm số thông báo chưa đọc.
     * GET /api/v1/notifications/unread-count
     */
    @GetMapping("/unread-count")
    public ApiResponse<Long> countUnread(
            @RequestAttribute("userId") Long userId) {
        return ApiResponse.success(notificationService.countUnread(userId));
    }

    // ===== UPDATE =====

    /**
     * Đánh dấu 1 thông báo đã đọc.
     * PUT /api/v1/notifications/{id}/read
     */
    @PutMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markAsRead(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        log.info("REST: Mark notification {} as read", id);
        return ApiResponse.success("Đã đánh dấu đã đọc",
                notificationService.markAsRead(id, userId));
    }

    /**
     * Đánh dấu tất cả thông báo đã đọc.
     * PUT /api/v1/notifications/read-all
     */
    @PutMapping("/read-all")
    public ApiResponse<Void> markAllAsRead(
            @RequestAttribute("userId") Long userId) {
        log.info("REST: Mark all notifications as read");
        notificationService.markAllAsRead(userId);
        return ApiResponse.success("Đã đánh dấu tất cả đã đọc", null);
    }

    // ===== DELETE =====

    /**
     * Xóa thông báo.
     * DELETE /api/v1/notifications/{id}
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteNotification(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        notificationService.deleteNotification(id, userId);
        return ApiResponse.success("Xóa thông báo thành công", null);
    }
}