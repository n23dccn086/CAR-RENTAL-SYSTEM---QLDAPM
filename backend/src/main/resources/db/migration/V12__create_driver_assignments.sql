-- ============================================================
-- V12: DRIVER ASSIGNMENTS (Gán tài xế cho đơn có tài xế)
-- ============================================================

CREATE TABLE driver_assignments (
    id              BIGSERIAL PRIMARY KEY,
    booking_id      BIGINT NOT NULL,
    driver_id       BIGINT NOT NULL,
    token           VARCHAR(64) NOT NULL UNIQUE,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reject_reason   VARCHAR(255),
    deadline_at     TIMESTAMP NOT NULL,
    responded_at    TIMESTAMP,
    attempt_number  INT DEFAULT 1,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignment_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_assignment_driver FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

CREATE INDEX idx_assignment_booking ON driver_assignments(booking_id);
CREATE INDEX idx_assignment_driver ON driver_assignments(driver_id);
CREATE INDEX idx_assignment_status ON driver_assignments(status);
CREATE INDEX idx_assignment_token ON driver_assignments(token);
CREATE INDEX idx_assignment_status_deadline ON driver_assignments(status, deadline_at);