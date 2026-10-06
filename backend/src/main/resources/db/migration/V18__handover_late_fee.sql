-- V18: Thêm field tính phí vượt giờ cho biên bản RETURN (UC-C12)
-- Mục đích: Khi khách trả xe muộn, tính phí theo bảng 5 mức

ALTER TABLE handover_records
    ADD COLUMN IF NOT EXISTS actual_return_time TIMESTAMP,
    ADD COLUMN IF NOT EXISTS late_fee NUMERIC(12, 0) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS late_minutes INT DEFAULT 0;

-- Backfill: actual_return_time = created_at cho RETURN cũ
UPDATE handover_records
SET actual_return_time = created_at
WHERE handover_type = 'RETURN' AND actual_return_time IS NULL;

-- Comment
COMMENT ON COLUMN handover_records.actual_return_time IS 'Thời gian khách trả xe thực tế (chỉ RETURN)';
COMMENT ON COLUMN handover_records.late_fee IS 'Phí vượt giờ (VND) — tính theo bảng 5 mức';
COMMENT ON COLUMN handover_records.late_minutes IS 'Số phút trả muộn so với endDate';