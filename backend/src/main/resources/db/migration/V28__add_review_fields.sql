-- Migration: Add missing review fields according to API Contract Module 8
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS driver_rating INT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS images TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS owner_reply TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP;
