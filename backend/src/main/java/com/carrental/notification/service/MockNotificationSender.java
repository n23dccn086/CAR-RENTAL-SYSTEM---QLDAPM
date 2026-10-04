package com.carrental.notification.service;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

/**
 * Mock sender: in ra console thay vì gửi SMS thật.
 * Dùng trong dev/demo (không tốn tiền SMS).
 */
@Service
@Profile("!prod")
public class MockNotificationSender implements NotificationSender {

    @Override
    public void send(String phone, String message) {
        System.out.println();
        System.out.println("+==================================================================+");
        System.out.println("|                   MOCK SMS - TIN NHAN GUI TAI XE                 |");
        System.out.println("+==================================================================+");
        System.out.println("| So dien thoai: " + phone);
        System.out.println("| Noi dung:");
        System.out.println("|    " + message);
        System.out.println("+==================================================================+");
        System.out.println();
    }
}