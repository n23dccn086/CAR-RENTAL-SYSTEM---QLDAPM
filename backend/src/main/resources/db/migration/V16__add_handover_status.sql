-- ============================================================
-- V16: HANDOVER STATUS + SIGNATURE TEXT
-- ============================================================

-- 1. Thêm cột status cho handover_records
ALTER TABLE handover_records 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PENDING';

CREATE INDEX IF NOT EXISTS idx_handover_status 
ON handover_records(status);

-- 2. Đổi chữ ký sang TEXT (đủ chứa URL dài nếu cần)
ALTER TABLE handover_records 
ALTER COLUMN owner_signature TYPE TEXT;

ALTER TABLE handover_records 
ALTER COLUMN customer_signature TYPE TEXT;

-- 3. Đổi damages sang TEXT (đã là JSONB, đổi về TEXT cho đơn giản)
-- Nếu giữ JSONB thì bỏ comment dòng dưới
-- ALTER TABLE handover_records ALTER COLUMN damages TYPE TEXT USING damages::text;

-- 4. Comment
COMMENT ON COLUMN handover_records.status IS 'PENDING (chưa ký đủ), SIGNED (đã ký 2 bên), CANCELLED';