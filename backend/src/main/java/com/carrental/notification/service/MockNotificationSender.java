package com.carrental.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

/**
 * Mock sender: chỉ log ra console thay vì gửi SMS thật.
 * Dùng trong dev/demo (không tốn tiền SMS).
 */
@Service
@Profile("!prod")
@Slf4j
public class MockNotificationSender implements NotificationSender {

    @Override
    public void send(String phone, String message) {
        log.info("========== MOCK SMS ==========");
        log.info("To: {}", phone);
        log.info("Content: {}", message);
        log.info("================================");
    }
}