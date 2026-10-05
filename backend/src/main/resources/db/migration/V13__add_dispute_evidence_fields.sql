-- ============================================================
-- V13: ADD EVIDENCE FIELDS TO DISPUTES
-- ============================================================

ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS admin_request TEXT,
ADD COLUMN IF NOT EXISTS evidence_history jsonb,
ADD COLUMN IF NOT EXISTS last_submitted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_disputes_last_submitted 
ON disputes(last_submitted_at);