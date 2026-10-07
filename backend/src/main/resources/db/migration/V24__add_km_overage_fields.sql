-- V24: Thêm field lưu phí vượt km vào handover_records
ALTER TABLE handover_records
    ADD COLUMN IF NOT EXISTS km_driven INT,
    ADD COLUMN IF NOT EXISTS km_allowed INT,
    ADD COLUMN IF NOT EXISTS km_overage INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS km_overage_fee NUMERIC(12, 0) DEFAULT 0;

COMMENT ON COLUMN handover_records.km_driven IS 'Số km đã chạy (chỉ RETURN)';
COMMENT ON COLUMN handover_records.km_allowed IS 'Số km được phép = km_per_day × rental_days';
COMMENT ON COLUMN handover_records.km_overage IS 'Số km vượt định mức';
COMMENT ON COLUMN handover_records.km_overage_fee IS 'Phí vượt km (VND) — theo 3 bậc config';