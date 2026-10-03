-- ============================================================
-- V6: ADMIN MODULE TABLES
-- ============================================================

-- 1. DISPUTES — Tranh chấp
CREATE TABLE disputes (
    id              BIGSERIAL PRIMARY KEY,
    dispute_code    VARCHAR(20) NOT NULL UNIQUE,
    booking_id      BIGINT NOT NULL,
    raised_by       BIGINT NOT NULL,
    against_user    BIGINT NOT NULL,
    category        VARCHAR(30) NOT NULL,
    description     TEXT NOT NULL,
    evidence        JSONB,
    claimed_amount  DECIMAL(12,0),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    resolution      TEXT,
    resolved_amount DECIMAL(12,0),
    resolved_by     BIGINT,
    resolved_at     TIMESTAMP,
    deadline_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP,
    
    CONSTRAINT fk_disputes_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_disputes_raised_by FOREIGN KEY (raised_by) REFERENCES users(id),
    CONSTRAINT fk_disputes_against FOREIGN KEY (against_user) REFERENCES users(id),
    CONSTRAINT fk_disputes_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(id)
);

CREATE INDEX idx_disputes_booking ON disputes(booking_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_raised_by ON disputes(raised_by);

-- 2. WITHDRAWALS — Yêu cầu rút tiền
CREATE TABLE withdrawals (
    id              BIGSERIAL PRIMARY KEY,
    owner_id        BIGINT NOT NULL,
    amount          DECIMAL(12,0) NOT NULL,
    bank_name       VARCHAR(100) NOT NULL,
    bank_account    VARCHAR(50) NOT NULL,
    account_holder  VARCHAR(100) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reject_reason   VARCHAR(255),
    processed_by    BIGINT,
    processed_at    TIMESTAMP,
    transaction_id  VARCHAR(100),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP,
    
    CONSTRAINT fk_withdrawals_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT fk_withdrawals_processed_by FOREIGN KEY (processed_by) REFERENCES users(id)
);

CREATE INDEX idx_withdrawals_owner ON withdrawals(owner_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);

-- 3. PLATFORM_CONFIG — Cấu hình nền tảng
CREATE TABLE platform_config (
    id              BIGSERIAL PRIMARY KEY,
    config_key      VARCHAR(100) NOT NULL UNIQUE,
    config_value    TEXT NOT NULL,
    config_type     VARCHAR(20) NOT NULL DEFAULT 'STRING',
    description     VARCHAR(255),
    updated_by      BIGINT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_config_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX idx_config_key ON platform_config(config_key);

-- 4. APPROVAL_LOGS — Log duyệt hồ sơ
CREATE TABLE approval_logs (
    id              BIGSERIAL PRIMARY KEY,
    target_type     VARCHAR(30) NOT NULL,
    target_id       BIGINT NOT NULL,
    action          VARCHAR(20) NOT NULL,
    reason          TEXT,
    approved_by     BIGINT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_approval_approved_by FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE INDEX idx_approval_target ON approval_logs(target_type, target_id);
CREATE INDEX idx_approval_approved_by ON approval_logs(approved_by);

-- ============================================================
-- SEED DATA — Cấu hình mặc định
-- ============================================================
INSERT INTO platform_config (config_key, config_value, config_type, description) VALUES
('commission_rate', '15', 'NUMBER', 'Tỷ lệ hoa hồng nền tảng (%)'),
('min_withdrawal', '100000', 'NUMBER', 'Số tiền rút tối thiểu (VNĐ)'),
('withdrawal_fee', '0', 'NUMBER', 'Phí rút tiền (VNĐ)'),
('default_deposit_percent', '30', 'NUMBER', 'Tỷ lệ cọc mặc định (%)'),
('default_overage_km_price', '5000', 'NUMBER', 'Phí vượt km mặc định (VNĐ/km)'),
('default_late_fee_per_hour', '100000', 'NUMBER', 'Phí trả muộn mỗi giờ (VNĐ)'),
('support_hotline', '1900-xxxx', 'STRING', 'Hotline hỗ trợ'),
('support_email', 'support@carrental.com', 'STRING', 'Email hỗ trợ');