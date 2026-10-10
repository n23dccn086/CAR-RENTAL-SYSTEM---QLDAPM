-- =====================================================
-- Bảng cars — Thông tin xe
-- =====================================================
CREATE TABLE IF NOT EXISTS cars (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    plate VARCHAR(20) NOT NULL UNIQUE,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    seats INT NOT NULL,
    transmission VARCHAR(20) NOT NULL,
    fuel_type VARCHAR(20) NOT NULL,
    color VARCHAR(30),
    current_km INT NOT NULL DEFAULT 0,
    price_per_day BIGINT NOT NULL,
    price_weekend BIGINT,
    price_holiday BIGINT,
    extra_km_price BIGINT DEFAULT 5000,
    delivery_fee BIGINT DEFAULT 100000,
    cleaning_fee BIGINT DEFAULT 0,
    car_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    rental_mode VARCHAR(20) NOT NULL DEFAULT 'SELF_DRIVE',
    address VARCHAR(255),
    delivery_radius INT DEFAULT 20,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_cars_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_cars_owner ON cars(owner_id);
CREATE INDEX IF NOT EXISTS idx_cars_plate ON cars(plate);
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_car_type ON cars(car_type);

-- =====================================================
-- Bảng car_images — Ảnh xe
-- =====================================================
CREATE TABLE IF NOT EXISTS car_images (
    id BIGSERIAL PRIMARY KEY,
    car_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_type VARCHAR(30),
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_car_images_car FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_car_images_car ON car_images(car_id);

-- =====================================================
-- Bảng car_documents — Giấy tờ xe
-- =====================================================
CREATE TABLE IF NOT EXISTS car_documents (
    id BIGSERIAL PRIMARY KEY,
    car_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    expiry_date DATE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_car_documents_car FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_car_documents_car ON car_documents(car_id);
CREATE INDEX IF NOT EXISTS idx_car_documents_type ON car_documents(document_type);