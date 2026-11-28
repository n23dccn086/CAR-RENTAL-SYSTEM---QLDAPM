package com.carrental.notification.service;

import org.springframework.stereotype.Service;

/**
 * Mock sender: in ra console thay vì gửi SMS thật (dự án chưa tích hợp nhà cung cấp SMS).
 * Là implementation DUY NHẤT của NotificationSender ở mọi profile — trước đây gắn @Profile("!prod")
 * khiến profile prod không khởi động được vì thiếu bean. Khi tích hợp SMS thật, thêm bean mới
 * đánh dấu @Primary.
 */
@Service
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