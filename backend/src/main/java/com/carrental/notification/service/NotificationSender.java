package com.carrental.notification.service;

/**
 * Interface chung cho các kênh gửi thông báo (SMS, Zalo, Email).
 * Production: dùng SMSSender thật (Twilio, ESMS...).
 * Demo/Dev: dùng MockNotificationSender.
 */
public interface NotificationSender {

    /**
     * Gửi tin nhắn tới số điện thoại.
     */
    void send(String phone, String message);
}