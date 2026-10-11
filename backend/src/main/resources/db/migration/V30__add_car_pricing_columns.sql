-- ============================================================
-- V30: ADD MISSING CAR PRICING FIELDS
-- ============================================================
-- Thêm các cột còn thiếu trong bảng cars
-- Đồng bộ với entity Car.java

ALTER TABLE cars ADD COLUMN IF NOT EXISTS base_km_per_day INT DEFAULT 300;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS deposit_percent INT DEFAULT 30;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS insurance_fee_per_day BIGINT DEFAULT 100000;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS price_with_driver BIGINT;