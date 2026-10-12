-- ============================================================
-- V35: FIX OWNER_REQUESTS TABLE
-- V21 tạo bảng thiếu cột deleted_at
-- V25 bị skip do IF NOT EXISTS
-- → Cần ALTER bổ sung các cột còn thiếu
-- ============================================================

-- 1. Thêm cột deleted_at
ALTER TABLE owner_requests 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 2. Thêm FK processed_by (nếu chưa có)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_owner_req_processed_by'
  ) THEN
    ALTER TABLE owner_requests
      ADD CONSTRAINT fk_owner_req_processed_by
      FOREIGN KEY (processed_by) REFERENCES users(id);
  END IF;
END $$;

-- 3. Index cho deleted_at
CREATE INDEX IF NOT EXISTS idx_owner_req_deleted 
ON owner_requests(deleted_at);

-- 4. Comment
COMMENT ON COLUMN owner_requests.deleted_at IS 'Soft delete timestamp';