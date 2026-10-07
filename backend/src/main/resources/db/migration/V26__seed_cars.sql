-- ============================================================
-- V26: SEED CARS FOR TESTING
-- 14 xe đủ loại với status = AVAILABLE
-- Owner ID = 2 (theo V10 seed users)
-- ============================================================

INSERT INTO cars (
    owner_id, plate, brand, model, year, seats,
    transmission, fuel_type, color, current_km,
    price_per_day, price_weekend, car_type, status, rental_mode,
    address, description, extra_km_price, delivery_fee, cleaning_fee, delivery_radius
)
VALUES
-- ===== SEDAN =====
(2, '51A-11111', 'Toyota', 'Camry 2.5Q', 2023, 5, 'AUTOMATIC', 'GASOLINE', 'Đen',
 15000, 1200000, 1400000, 'SEDAN', 'AVAILABLE', 'BOTH',
 'Quận 1, TP.HCM', 'Sedan hạng D sang trọng, phù hợp công tác', 5000, 100000, 50000, 20),

(2, '51A-11112', 'Honda', 'Accord', 2022, 5, 'AUTOMATIC', 'GASOLINE', 'Trắng',
 25000, 1100000, 1300000, 'SEDAN', 'AVAILABLE', 'SELF_DRIVE',
 'Quận 3, TP.HCM', 'Sedan Nhật bền bỉ, tiết kiệm xăng', 5000, 100000, 50000, 20),

(2, '51A-11113', 'Mazda', 'Mazda 6', 2023, 5, 'AUTOMATIC', 'GASOLINE', 'Đỏ',
 12000, 1000000, 1200000, 'SEDAN', 'AVAILABLE', 'SELF_DRIVE',
 'Quận 7, TP.HCM', 'Sedan thể thao, lái phê', 5000, 100000, 50000, 20),

(2, '51A-11114', 'Toyota', 'Vios', 2023, 4, 'AUTOMATIC', 'GASOLINE', 'Bạc',
 18000, 700000, 850000, 'SEDAN', 'AVAILABLE', 'SELF_DRIVE',
 'Hà Nội', 'Sedan nhỏ gọn, tiết kiệm, đi phố', 5000, 80000, 50000, 20),

-- ===== SUV =====
(2, '51A-22221', 'Ford', 'Everest Titanium', 2024, 7, 'AUTOMATIC', 'DIESEL', 'Đen',
 8000, 1800000, 2100000, 'SUV', 'AVAILABLE', 'BOTH',
 'Quận 2, TP.HCM', 'SUV 7 chỗ mạnh mẽ, đi đèo tốt', 7000, 150000, 100000, 30),

(2, '51A-22222', 'Toyota', 'Fortuner Legender', 2023, 7, 'AUTOMATIC', 'DIESEL', 'Trắng',
 18000, 1700000, 2000000, 'SUV', 'AVAILABLE', 'SELF_DRIVE',
 'Quận Bình Thạnh, TP.HCM', 'SUV 7 chỗ gia đình', 7000, 150000, 100000, 30),

(2, '51A-22223', 'Mazda', 'CX-5', 2023, 5, 'AUTOMATIC', 'GASOLINE', 'Xám',
 22000, 1400000, 1600000, 'SUV', 'AVAILABLE', 'SELF_DRIVE',
 'Quận 10, TP.HCM', 'SUV 5 chỗ gọn gàng, tiết kiệm', 7000, 120000, 80000, 25),

(2, '51A-22224', 'Honda', 'CR-V', 2023, 5, 'AUTOMATIC', 'GASOLINE', 'Trắng',
 15000, 1500000, 1700000, 'SUV', 'AVAILABLE', 'SELF_DRIVE',
 'Hà Nội', 'SUV 5 chỗ Nhật, rộng rãi', 7000, 120000, 80000, 25),

-- ===== MPV =====
(2, '51A-33331', 'Kia', 'Carnival', 2024, 7, 'AUTOMATIC', 'DIESEL', 'Nâu',
 5000, 2000000, 2400000, 'MPV', 'AVAILABLE', 'BOTH',
 'Quận 4, TP.HCM', 'MPV 7 chỗ rộng rãi, có tài xế', 8000, 200000, 120000, 40),

(2, '51A-33332', 'Toyota', 'Innova Cross', 2023, 7, 'AUTOMATIC', 'HYBRID', 'Bạc',
 10000, 1600000, 1900000, 'MPV', 'AVAILABLE', 'BOTH',
 'Quận Tân Bình, TP.HCM', 'MPV 7 chỗ hybrid tiết kiệm', 8000, 150000, 100000, 30),

-- ===== HATCHBACK =====
(2, '51A-44441', 'Honda', 'City Hatchback', 2023, 5, 'AUTOMATIC', 'GASOLINE', 'Xanh',
 14000, 800000, 950000, 'HATCHBACK', 'AVAILABLE', 'SELF_DRIVE',
 'Quận 5, TP.HCM', 'Hatchback nhỏ gọn, dễ đỗ xe', 5000, 80000, 50000, 20),

(2, '51A-44442', 'Toyota', 'Yaris', 2022, 5, 'AUTOMATIC', 'GASOLINE', 'Vàng',
 20000, 700000, 850000, 'HATCHBACK', 'AVAILABLE', 'SELF_DRIVE',
 'Đà Nẵng', 'Hatchback tiết kiệm, đi phố', 5000, 80000, 50000, 20),

-- ===== PICKUP =====
(2, '51A-55551', 'Ford', 'Ranger Wildtrak', 2024, 5, 'AUTOMATIC', 'DIESEL', 'Cam',
 3000, 1500000, 1800000, 'PICKUP', 'AVAILABLE', 'SELF_DRIVE',
 'Quận 9, TP.HCM', 'Bán tải mạnh mẽ, chở hàng tốt', 10000, 150000, 100000, 30),

(2, '51A-55552', 'Toyota', 'Hilux Adventure', 2023, 5, 'MANUAL', 'DIESEL', 'Trắng',
 16000, 1400000, 1650000, 'PICKUP', 'AVAILABLE', 'SELF_DRIVE',
 'Quận 12, TP.HCM', 'Bán tải số sàn bền bỉ', 10000, 150000, 100000, 30)
ON CONFLICT (plate) DO NOTHING;