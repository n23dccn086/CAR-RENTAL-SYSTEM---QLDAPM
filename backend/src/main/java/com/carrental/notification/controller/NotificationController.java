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
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class NotificationController {

    NotificationService notificationService;

    // ===== READ =====

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

    @GetMapping("/unread-count")
    public ApiResponse<Long> countUnread(
            @RequestAttribute("userId") Long userId) {
        return ApiResponse.success(notificationService.countUnread(userId));
    }

    // ===== UPDATE =====

    @PutMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markAsRead(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        log.info("REST: Mark notification {} as read", id);
        return ApiResponse.success("Đã đánh dấu đã đọc",
                notificationService.markAsRead(id, userId));
    }

    @PutMapping("/read-all")
    public ApiResponse<Void> markAllAsRead(
            @RequestAttribute("userId") Long userId) {
        log.info("REST: Mark all notifications as read");
        notificationService.markAllAsRead(userId);
        return ApiResponse.success("Đã đánh dấu tất cả đã đọc", null);
    }

    // ===== DELETE =====

    /**
     * Xóa 1 thông báo.
     * DELETE /api/v1/notifications/{id}
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteNotification(
            @PathVariable Long id,
            @RequestAttribute("userId") Long userId) {
        notificationService.deleteNotification(id, userId);
        return ApiResponse.success("Xóa thông báo thành công", null);
    }

    /**
     * ★ MỚI: Xóa nhiều thông báo theo list ID.
     * DELETE /api/v1/notifications/batch
     * Body: { "ids": [1, 2, 3] }
     */
    @DeleteMapping("/batch")
    public ApiResponse<Void> deleteBatch(
            @RequestAttribute("userId") Long userId,
            @RequestBody Map<String, List<Long>> body) {
        List<Long> ids = body.get("ids");
        log.info("REST: User {} batch delete {} notifications", userId,
                ids != null ? ids.size() : 0);
        notificationService.deleteBatch(ids, userId);
        return ApiResponse.success("Xóa thông báo thành công", null);
    }

    /**
     * ★ MỚI: Xóa tất cả thông báo của user.
     * DELETE /api/v1/notifications/all
     */
    @DeleteMapping("/all")
    public ApiResponse<Void> deleteAll(
            @RequestAttribute("userId") Long userId) {
        log.info("REST: User {} delete ALL notifications", userId);
        notificationService.deleteAll(userId);
        return ApiResponse.success("Đã xóa tất cả thông báo", null);
    }
}