-- =====================================================
-- Bảng payments — Giao dịch thanh toán
-- =====================================================
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    amount BIGINT NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    transaction_id VARCHAR(100) UNIQUE,
    gateway_transaction_id VARCHAR(100),
    payment_type VARCHAR(20) NOT NULL DEFAULT 'DEPOSIT',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_url VARCHAR(500),
    signature VARCHAR(500),
    gateway_response TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) REFERENCES users(id)
);

CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);
CREATE INDEX idx_payments_method ON payments(payment_method);

-- =====================================================
-- Bảng refunds — Hoàn tiền
-- =====================================================
CREATE TABLE refunds (
    id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    booking_id BIGINT NOT NULL,
    amount BIGINT NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    refund_transaction_id VARCHAR(100),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id) REFERENCES payments(id),
    CONSTRAINT fk_refunds_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_refunds_booking ON refunds(booking_id);
CREATE INDEX idx_refunds_status ON refunds(status);