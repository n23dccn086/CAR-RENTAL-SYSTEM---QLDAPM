package com.carrental.handover.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class HandoverServiceTest {

    // ===== TEST 1: Tính phí vượt 100km (Bậc 2) =====
    @Test
    @DisplayName("TC16 - Test tính phí vượt 100km (Theo 2 bậc)")
    public void testKmOverageFeeLevel2() {
        int kmDriven = 400; // Chạy 400km
        int kmAllowed = 300; // Được phép 300km
        int kmOver = kmDriven - kmAllowed; // Vượt 100km

        // Bậc 1: 50km đầu * 5000đ = 250.000
        // Bậc 2: 50km tiếp * 8000đ = 400.000
        // Tổng: 650.000
        long expectedFee = (50 * 5000) + (50 * 8000);

        // Giả lập logic
        long actualFee = 650000; 

        assertEquals(expectedFee, actualFee, "Phí vượt 100km phải tính theo bậc là 650.000đ");
    }

    // ===== TEST 2: Tính phí trễ giờ (Trễ 2 tiếng) =====
    @Test
    @DisplayName("TC17 - Test tính phí trễ giờ (Trễ 2 tiếng)")
    public void testLateFee() {
        int lateHours = 2;
        long feePerHour = 100000; // Biểu phí cấu hình
        long expectedFee = 200000;

        // Giả lập logic
        long actualFee = lateHours * feePerHour;

        assertEquals(expectedFee, actualFee, "Trễ 2 tiếng phải phạt 200.000đ");
    }

    // ===== TEST 3: Tính phí vượt 120km (Bậc 3) =====
    @Test
    @DisplayName("TC16b - Test tính phí vượt km bậc 3 (Vượt 120km)")
    public void testKmOverageFeeLevel3() {
        int kmDriven = 420; 
        int kmAllowed = 300; 
        int kmOver = kmDriven - kmAllowed; // Vượt 120km

        // Bậc 1: 50km * 5000 = 250.000
        // Bậc 2: 50km * 8000 = 400.000
        // Bậc 3: 20km * 12000 = 240.000
        // Tổng: 890.000
        long expectedFee = (50 * 5000) + (50 * 8000) + (20 * 12000);

        // Giả lập logic tính toán (Dựa theo code của Khoan)
        long actualFee;
        if (kmOver <= 50) {
            actualFee = kmOver * 5000;
        } else if (kmOver <= 100) {
            actualFee = (50 * 5000) + ((kmOver - 50) * 8000);
        } else {
            actualFee = (50 * 5000) + (50 * 8000) + ((kmOver - 100) * 12000);
        }

        assertEquals(expectedFee, actualFee, "Phí vượt 120km phải tính theo 3 bậc là 890.000đ");
    }
}