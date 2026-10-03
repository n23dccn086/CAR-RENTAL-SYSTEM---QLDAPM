package com.carrental.notification.service;

import com.carrental.notification.dto.NotificationResponse;
import com.carrental.notification.entity.NotificationType;

import java.util.List;

/**
 * Service xử lý nghiệp vụ thông báo.
 */
public interface NotificationService {

    /** Lấy danh sách thông báo của user */
    List<NotificationResponse> getMyNotifications(Long userId);

    /** Lấy danh sách thông báo chưa đọc */
    List<NotificationResponse> getMyUnreadNotifications(Long userId);

    /** Lấy danh sách thông báo theo type */
    List<NotificationResponse> getMyNotificationsByType(Long userId, NotificationType type);

    /** Đếm số thông báo chưa đọc */
    long countUnread(Long userId);

    /** Đánh dấu 1 thông báo đã đọc */
    NotificationResponse markAsRead(Long notificationId, Long userId);

    /** Đánh dấu tất cả thông báo đã đọc */
    void markAllAsRead(Long userId);

    /** Xóa thông báo */
    void deleteNotification(Long notificationId, Long userId);

    // ===== INTERNAL (dùng cho module khác) =====

    /** Tạo thông báo mới — dùng nội bộ */
    NotificationResponse createNotification(Long userId, NotificationType type,
                                           String title, String content, Long referenceId);
}