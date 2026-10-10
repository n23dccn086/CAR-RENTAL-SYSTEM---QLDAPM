package com.carrental.notification.service;

import com.carrental.common.constant.ErrorCode;
import com.carrental.common.exception.ResourceNotFoundException;
import com.carrental.common.exception.UnauthorizedException;
import com.carrental.notification.dto.NotificationMapper;
import com.carrental.notification.dto.NotificationResponse;
import com.carrental.notification.entity.Notification;
import com.carrental.notification.entity.NotificationType;
import com.carrental.notification.repository.NotificationRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    NotificationRepository notificationRepository;
    NotificationMapper notificationMapper;

    // ===== READ =====

    @Override
    public List<NotificationResponse> getMyNotifications(Long userId) {
        List<Notification> notifications =
                notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return notificationMapper.toResponseList(notifications);
    }

    @Override
    public List<NotificationResponse> getMyUnreadNotifications(Long userId) {
        List<Notification> notifications =
                notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        return notificationMapper.toResponseList(notifications);
    }

    @Override
    public List<NotificationResponse> getMyNotificationsByType(Long userId, NotificationType type) {
        List<Notification> notifications =
                notificationRepository.findByUserIdAndTypeOrderByCreatedAtDesc(userId, type);
        return notificationMapper.toResponseList(notifications);
    }

    @Override
    public org.springframework.data.domain.Page<NotificationResponse> getMyNotificationsPaged(
            Long userId, boolean unreadOnly, NotificationType type, org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<Notification> pageResult;
        if (unreadOnly) {
            if (type != null) {
                pageResult = notificationRepository.findByUserIdAndTypeAndIsReadFalseOrderByCreatedAtDesc(userId, type, pageable);
            } else {
                pageResult = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, pageable);
            }
        } else {
            if (type != null) {
                pageResult = notificationRepository.findByUserIdAndTypeOrderByCreatedAtDesc(userId, type, pageable);
            } else {
                pageResult = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
            }
        }
        return pageResult.map(notificationMapper::toResponse);
    }

    @Override
    public long countUnread(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    // ===== UPDATE =====

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long notificationId, Long userId) {
        log.info("Mark notification {} as read by user {}", notificationId, userId);

        Notification notification = getEntityById(notificationId);

        if (!notification.getUserId().equals(userId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Bạn không có quyền đánh dấu thông báo này");
        }

        notification.setIsRead(true);
        Notification updated = notificationRepository.save(notification);

        return notificationMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        log.info("Mark all notifications as read for user {}", userId);

        List<Notification> unread =
                notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);

        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);

        log.info("Marked {} notifications as read", unread.size());
    }

    // ===== DELETE =====

    @Override
    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        log.info("Delete notification {} by user {}", notificationId, userId);

        Notification notification = getEntityById(notificationId);

        if (!notification.getUserId().equals(userId)) {
            throw new UnauthorizedException(ErrorCode.PERMISSION_DENIED,
                    "Bạn không có quyền xóa thông báo này");
        }

        notificationRepository.delete(notification);
        log.info("Notification deleted id: {}", notificationId);
    }

    @Override
    @Transactional
    public void deleteBatch(List<Long> ids, Long userId) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        log.info("Delete {} notifications by user {}", ids.size(), userId);
        notificationRepository.deleteByIdInAndUserId(ids, userId);
        log.info("Batch delete done");
    }

    @Override
    @Transactional
    public void deleteAll(Long userId) {
        log.info("Delete ALL notifications of user {}", userId);
        notificationRepository.deleteAllByUserId(userId);
        log.info("All notifications deleted for user {}", userId);
    }

    // ===== INTERNAL =====

    @Override
    @Transactional
    public NotificationResponse createNotification(Long userId, NotificationType type,
                                                    String title, String content, Long referenceId) {
        log.info("Create notification for user: {}, type: {}", userId, type);

        Notification notification = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .content(content)
                .referenceId(referenceId)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Notification created with id: {}", saved.getId());

        return notificationMapper.toResponse(saved);
    }

    // ===== HELPER =====

    private Notification getEntityById(Long id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        ErrorCode.NOTIFICATION_NOT_FOUND));
    }
}