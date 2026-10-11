-- ============================================================
-- V31: CREATE CAR_BLOCKED_DATES TABLE
-- ============================================================
-- Bảng lưu lịch bận của xe (owner tự chặn ngày)
-- Đồng bộ với entity CarBlockedDate.java

CREATE TABLE IF NOT EXISTS car_blocked_dates (
    id          BIGSERIAL PRIMARY KEY,
    car_id      BIGINT NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    reason      VARCHAR(50) DEFAULT 'maintenance',
    note        TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_blocked_dates_car FOREIGN KEY (car_id)
        REFERENCES cars(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_car
ON car_blocked_dates(car_id);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_range
ON car_blocked_dates(car_id, start_date, end_date);

COMMENT ON TABLE car_blocked_dates IS 'Lịch bận của xe (owner chặn ngày)';
COMMENT ON COLUMN car_blocked_dates.reason IS 'maintenance, personal, booked, other';