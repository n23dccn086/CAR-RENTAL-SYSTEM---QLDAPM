-- ============================================================
-- V14: ADD COUNTER EVIDENCE + DEADLINE + STATUS FIELDS
-- ============================================================

-- Thông tin phản bác của khách
ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS counter_description TEXT,
ADD COLUMN IF NOT EXISTS counter_evidence jsonb,
ADD COLUMN IF NOT EXISTS counter_filed_at TIMESTAMP;

-- Deadline cho các bên
ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS counter_deadline_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS review_deadline_at TIMESTAMP;

-- Đánh dấu bên nào cần bổ sung
ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS awaiting_response_from VARCHAR(20);

-- File hợp đồng
ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS contract_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS contract_generated_at TIMESTAMP;

-- Index
CREATE INDEX IF NOT EXISTS idx_disputes_counter_deadline 
ON disputes(counter_deadline_at) 
WHERE counter_deadline_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_disputes_awaiting_response 
ON disputes(awaiting_response_from);