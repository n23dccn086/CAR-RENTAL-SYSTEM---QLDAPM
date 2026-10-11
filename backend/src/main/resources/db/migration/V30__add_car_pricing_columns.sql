$content = @'
-- ============================================================
-- V30: ADD MISSING CAR PRICING COLUMNS
-- ============================================================
-- Sync DB schema with Car entity

ALTER TABLE cars ADD COLUMN IF NOT EXISTS base_km_per_day INT DEFAULT 300;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS deposit_percent INT DEFAULT 30;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS insurance_fee_per_day BIGINT DEFAULT 100000;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS price_with_driver BIGINT;
'@

Set-Content -Path "D:\CAR-RENTAL-SYSTEM---QLDAPM\backend\src\main\resources\db\migration\V30__add_car_pricing_columns.sql" -Value $content -Encoding UTF8