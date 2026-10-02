-- =====================================================
-- Bảng reviews — Đánh giá sau chuyến
-- =====================================================
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    car_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    car_rating INT NOT NULL,
    owner_rating INT NOT NULL,
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_reviews_car FOREIGN KEY (car_id) REFERENCES cars(id),
    CONSTRAINT fk_reviews_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
CREATE INDEX idx_reviews_car ON reviews(car_id);
CREATE INDEX idx_reviews_owner ON reviews(owner_id);

-- =====================================================
-- Bảng drivers — Tài xế
-- =====================================================
CREATE TABLE drivers (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(150),
    cccd VARCHAR(20),
    license_number VARCHAR(30) NOT NULL,
    license_class VARCHAR(10) NOT NULL,
    license_expiry DATE,
    date_of_birth DATE,
    address VARCHAR(255),
    experience_years INT DEFAULT 0,
    avatar_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    rating DOUBLE PRECISION DEFAULT 0,
    total_trips INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_drivers_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE INDEX idx_drivers_owner ON drivers(owner_id);
CREATE INDEX idx_drivers_phone ON drivers(phone);
CREATE INDEX idx_drivers_status ON drivers(status);

-- =====================================================
-- Bảng notifications — Thông báo
-- =====================================================
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(30) NOT NULL,
    reference_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);