-- ============================================================
-- V7: HANDOVER MODULE TABLES (Biên bản giao nhận xe)
-- ============================================================

-- 1. HANDOVER_RECORDS — Biên bản giao/nhận xe
CREATE TABLE IF NOT EXISTS handover_records (
    id                  BIGSERIAL PRIMARY KEY,
    booking_id          BIGINT NOT NULL,
    handover_type       VARCHAR(20) NOT NULL,  -- PICKUP, RETURN
    km_reading          INT,
    fuel_level          SMALLINT,              -- 0-100 (%)
    exterior_note       TEXT,
    interior_note       TEXT,
    damages             JSONB,                 -- [{type, location, note}]
    extra_fees          DECIMAL(12,0) DEFAULT 0,
    extra_fees_note     TEXT,
    owner_signature     VARCHAR(500),
    customer_signature  VARCHAR(500),
    owner_signed_at     TIMESTAMP,
    customer_signed_at  TIMESTAMP,
    record_hash         VARCHAR(64),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMP,

    CONSTRAINT fk_handover_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT uk_booking_type UNIQUE (booking_id, handover_type)
);

CREATE INDEX IF NOT EXISTS idx_handover_booking ON handover_records(booking_id);
CREATE INDEX IF NOT EXISTS idx_handover_type ON handover_records(handover_type);

-- 2. HANDOVER_IMAGES — Ảnh biên bản
CREATE TABLE IF NOT EXISTS handover_images (
    id              BIGSERIAL PRIMARY KEY,
    handover_id     BIGINT NOT NULL,
    image_url       VARCHAR(500) NOT NULL,
    image_type      VARCHAR(20) DEFAULT 'OTHER',  -- SCRATCH, DENT, INTERIOR, FUEL, DASHBOARD, OTHER
    note            VARCHAR(255),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_image_handover FOREIGN KEY (handover_id) REFERENCES handover_records(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_image_handover ON handover_images(handover_id);