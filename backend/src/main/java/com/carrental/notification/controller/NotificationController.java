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

    /**
     * Contract 13.1: GET /notifications?unread_only=true&page=1&limit=20
     */
    @GetMapping
    public ApiResponse<Object> getMyNotifications(
            @RequestAttribute("userId") Long userId,
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false) Boolean unreadOnly,
            @RequestParam(value = "unread_only", required = false) Boolean unread_only,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {

        boolean isUnreadOnly = Boolean.TRUE.equals(unreadOnly) || Boolean.TRUE.equals(unread_only);
        int pageNum = page != null ? (page > 0 ? page - 1 : 0) : 0;
        int pageSize = limit != null ? limit : 20;

        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(
                        pageNum, pageSize, org.springframework.data.domain.Sort.by(
                                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));

        org.springframework.data.domain.Page<NotificationResponse> paged =
                notificationService.getMyNotificationsPaged(userId, isUnreadOnly, type, pageable);
        long unreadCount = notificationService.countUnread(userId);

        Map<String, Object> data = new java.util.LinkedHashMap<>();
        data.put("notifications", paged.getContent());
        data.put("unread_count", unreadCount);
        data.put("total", paged.getTotalElements());
        data.put("page", paged.getNumber() + 1);
        data.put("limit", paged.getSize());
        data.put("total_pages", paged.getTotalPages());

        return ApiResponse.success(data);
    }

    @GetMapping("/unread-count")
    public ApiResponse<Long> countUnread(
            @RequestAttribute("userId") Long userId) {
        return ApiResponse.success(notificationService.countUnread(userId));
    }

    // ===== UPDATE =====

    /**
     * Contract 13.2: PUT /notifications/:id/read
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
     * Contract 13.2: PUT /notifications/read-all
     */
    @PutMapping("/read-all")
    public ApiResponse<Void> markAllAsRead(
            @RequestAttribute("userId") Long userId) {
        log.info("REST: Mark all notifications as read");
        notificationService.markAllAsRead(userId);
        return ApiResponse.success("Đã đánh dấu đã đọc", null);
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