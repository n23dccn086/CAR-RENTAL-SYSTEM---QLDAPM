-- V27: Bảng lưu OTP đặt lại mật khẩu
CREATE TABLE IF NOT EXISTS password_reset_otps (
    id          BIGSERIAL PRIMARY KEY,
    phone       VARCHAR(15) NOT NULL,
    otp         VARCHAR(6) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    is_used     BOOLEAN NOT NULL DEFAULT FALSE,
    attempts    INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON password_reset_otps(phone);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON password_reset_otps(expires_at);