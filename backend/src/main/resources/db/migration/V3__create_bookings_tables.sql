-- =====================================================
-- Bảng bookings — Đơn đặt xe
-- =====================================================
CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    car_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    actual_return_date TIMESTAMP,
    pickup_address VARCHAR(255),
    return_address VARCHAR(255),
    rental_mode VARCHAR(20) NOT NULL DEFAULT 'SELF_DRIVE',
    driver_id BIGINT,
    total_price BIGINT NOT NULL,
    deposit_amount BIGINT NOT NULL,
    remaining_amount BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    customer_note TEXT,
    owner_note TEXT,
    cancel_reason TEXT,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_bookings_car FOREIGN KEY (car_id) REFERENCES cars(id),
    CONSTRAINT fk_bookings_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_car ON bookings(car_id);
CREATE INDEX idx_bookings_owner ON bookings(owner_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);

-- =====================================================
-- Bảng booking_details — Chi tiết phí
-- =====================================================
CREATE TABLE booking_details (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    rental_days INT NOT NULL,
    price_per_day BIGINT NOT NULL,
    rental_fee BIGINT NOT NULL,
    delivery_fee BIGINT DEFAULT 0,
    insurance_fee BIGINT DEFAULT 0,
    driver_fee BIGINT DEFAULT 0,
    discount BIGINT DEFAULT 0,
    extra_fee BIGINT DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_details_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX idx_booking_details_booking ON booking_details(booking_id);