-- Migration V34: Thêm cột rejection_reason cho bảng drivers
-- Mục đích: Lưu lý do Admin từ chối tài xế

ALTER TABLE drivers
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Comment cho cột (PostgreSQL)
COMMENT ON COLUMN drivers.rejection_reason IS 'Lý do Admin từ chối tài xế (NULL nếu không bị từ chối)';