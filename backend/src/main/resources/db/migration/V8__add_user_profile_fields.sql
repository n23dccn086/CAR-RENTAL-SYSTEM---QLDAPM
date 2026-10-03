-- ============================================================
-- V8: ADD PROFILE FIELDS TO USERS
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);