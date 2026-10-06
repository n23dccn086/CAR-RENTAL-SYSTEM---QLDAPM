-- V17: Thêm field fee + net_amount vào bảng withdrawals
-- Mục đích: Lưu phí rút tiền và số tiền thực nhận của owner

ALTER TABLE withdrawals
    ADD COLUMN IF NOT EXISTS fee NUMERIC(12, 0) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS net_amount NUMERIC(12, 0);

-- Set net_amount = amount - fee cho các record cũ (fee = 0)
UPDATE withdrawals
SET net_amount = amount - COALESCE(fee, 0)
WHERE net_amount IS NULL;

-- Set NOT NULL sau khi đã backfill
ALTER TABLE withdrawals
    ALTER COLUMN net_amount SET NOT NULL;

-- Comment
COMMENT ON COLUMN withdrawals.fee IS 'Phí rút tiền (VND) — snapshot tại thời điểm tạo yêu cầu';
COMMENT ON COLUMN withdrawals.net_amount IS 'Số tiền thực nhận = amount - fee';