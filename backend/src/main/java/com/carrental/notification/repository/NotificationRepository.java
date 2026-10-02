package com.carrental.notification.repository;

import com.carrental.notification.entity.Notification;
import com.carrental.notification.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, NotificationType type);

    long countByUserIdAndIsReadFalse(Long userId);
}