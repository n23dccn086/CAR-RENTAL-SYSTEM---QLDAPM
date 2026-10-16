-- ============================================================
-- V35: ALTER HANDOVER DAMAGES COLUMN FROM JSONB TO TEXT
-- Fix: Hibernate sends string, causing error:
-- "column damages is of type jsonb but expression is of type character varying"
-- ============================================================

ALTER TABLE handover_records 
ALTER COLUMN damages TYPE TEXT USING damages::text;
