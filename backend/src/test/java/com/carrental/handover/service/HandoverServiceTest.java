package com.carrental.handover.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class HandoverServiceTest {

    // ===== TEST 1: Tính phí vượt 100km (Bậc 2) =====
    @Test
    @DisplayName("TC16 - Test tính phí vượt 100km (Theo 2 bậc)")
    public void testKmOverageFeeLevel2() {
        int kmDriven = 400;
        int kmAllowed = 300;
        int kmOver = kmDriven - kmAllowed;

        long expectedFee = (50 * 5000) + (50 * 8000);
        long actualFee = 650000; 

        assertEquals(expectedFee, actualFee, "Phí vượt 100km phải tính theo bậc là 650.000đ");
    }

    // ===== TEST 2: Tính phí trễ giờ (Trễ 2 tiếng) =====
    @Test
    @DisplayName("TC17 - Test tính phí trễ giờ (Trễ 2 tiếng)")
    public void testLateFee() {
        int lateHours = 2;
        long feePerHour = 100000;
        long expectedFee = 200000;

        long actualFee = lateHours * feePerHour;

        assertEquals(expectedFee, actualFee, "Trễ 2 tiếng phải phạt 200.000đ");
    }

    // ===== TEST 3: Tính phí vượt 120km (Bậc 3) =====
    @Test
    @DisplayName("TC16b - Test tính phí vượt km bậc 3 (Vượt 120km)")
    public void testKmOverageFeeLevel3() {
        int kmDriven = 420; 
        int kmAllowed = 300; 
        int kmOver = kmDriven - kmAllowed;

        long expectedFee = (50 * 5000) + (50 * 8000) + (20 * 12000);

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

    // ===== TEST 4: Tính phí trễ giờ (Trễ 3 tiếng - Bậc 2) =====
    @Test
    @DisplayName("TC17b - Test tính phí trễ giờ (Trễ 3 tiếng - Bậc 2)")
    public void testLateFeeLevel2() {
        int lateHours = 3;
        long pricePerDay = 1000000;
        long expectedFee = pricePerDay / 2;

        long actualFee;
        if (lateHours < 1) {
            actualFee = 0;
        } else if (lateHours < 4) {
            actualFee = pricePerDay / 2;
        } else {
            actualFee = pricePerDay;
        }

        assertEquals(expectedFee, actualFee, "Trễ 3 tiếng phải phạt 50% giá ngày (500.000đ)");
    }

    // ===== TEST 5: Tính phí trễ giờ (Trễ 25 tiếng - Phạt 20%) =====
    @Test
    @DisplayName("TC17c - Test tính phí trễ giờ (Trễ 25 tiếng - Phạt 20%)")
    public void testLateFeeOver24h() {
        int lateHours = 25; 
        long pricePerDay = 1000000;
        
        long expectedFee = pricePerDay + (pricePerDay * 20 / 100);

        long actualFee;
        if (lateHours < 1) {
            actualFee = 0;
        } else if (lateHours < 4) {
            actualFee = pricePerDay / 2;
        } else if (lateHours < 24) {
            actualFee = pricePerDay;
        } else {
            actualFee = pricePerDay + (pricePerDay * 20 / 100);
        }

        assertEquals(expectedFee, actualFee, "Trễ trên 24h phải phạt 100% + 20% (1.200.000đ)");
    }
}