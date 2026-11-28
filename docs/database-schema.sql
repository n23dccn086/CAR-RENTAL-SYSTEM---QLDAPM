-- =============================================================================
-- CAR RENTAL SYSTEM (QLDAPM - Nhóm 10) — LƯỢC ĐỒ CƠ SỞ DỮ LIỆU POSTGRESQL 15
-- =============================================================================
-- BẢN CHỤP THAM KHẢO (REFERENCE SNAPSHOT) — KHÔNG DÙNG ĐỂ KHỞI TẠO CSDL THẬT.
--
-- * Nguồn sự thật (source of truth) là các Flyway migration trong
--   backend/src/main/resources/db/migration/ (V1 → V37). Backend tự chạy Flyway
--   khi khởi động (application.yml: spring.flyway.enabled=true,
--   baseline-on-migrate=true, out-of-order=true).
-- * File này được tổng hợp bằng cách đọc lần lượt V1..V37 theo thứ tự phiên bản,
--   áp dụng các lệnh ALTER / DELETE / DROP để ra TRẠNG THÁI CUỐI, rồi đối chiếu
--   với 24 lớp JPA @Entity trong backend/src/main/java/com/carrental/**/entity.
-- * Lưu ý: application.yml đặt mặc định spring.jpa.hibernate.ddl-auto=update,
--   nên Hibernate có thể tự thêm cột nếu entity có mà migration chưa có. Tại thời
--   điểm tổng hợp, mọi cột trong entity đều đã có trong migration (khác biệt duy
--   nhất: car_images.image_type entity khai báo length=20, migration là 30).
-- * Một số ràng buộc nghiệp vụ chỉ kiểm tra ở tầng ứng dụng (không có CHECK
--   trong CSDL) — được ghi chú bằng "-- [App]" bên cạnh cột.
-- * Các giá trị trạng thái (status) được lưu dạng VARCHAR (JPA EnumType.STRING
--   hoặc chuỗi cố định trong service).
--
-- Tổng số bảng: 24
--   Người dùng & xác thực : users, user_documents, password_reset_otps,
--                           owner_requests, owner_request_documents
--   Xe                    : cars, car_images, car_documents, car_blocked_dates
--   Đặt xe & thanh toán   : bookings, booking_details, payments, refunds
--   Tài xế                : drivers, driver_assignments
--   Giao nhận & tương tác : handover_records, handover_images, reviews,
--                           review_replies, disputes, notifications
--   Quản trị              : withdrawals, platform_config, approval_logs
--
-- Lịch sử thay đổi chính rút ra từ migration:
--   V8, V9   : bổ sung cột hồ sơ / quản trị cho users
--   V13, V14 : bổ sung cột bằng chứng, phản tố, hạn chót cho disputes
--   V16      : thêm handover_records.status; chữ ký đổi sang TEXT
--   V17      : withdrawals thêm fee, net_amount (NOT NULL sau khi backfill)
--   V18, V24 : handover_records thêm cột phí trễ giờ và phí vượt km
--   V21/V25  : cùng tạo owner_requests (V25 bị bỏ qua do IF NOT EXISTS);
--              V33 bổ sung deleted_at + FK processed_by còn thiếu
--   V22      : xóa config refund_owner_reject_percent (bắt buộc hoàn 100%)
--   V20 → V23: config km theo loại xe bị xóa, thay bằng 3 bậc km chung
--   V28, V36 : reviews thêm driver_rating, images, owner_reply, customer_reply
--   V30      : cars thêm base_km_per_day, deposit_percent,
--              insurance_fee_per_day, price_with_driver
--   V35      : handover_records.damages đổi sang TEXT
--   V37      : tạo review_replies (luồng hội thoại nhiều lượt)
--   Seed     : V10/V11/V29 (3 tài khoản mẫu), V26 (14 xe), V32 (3 tài xế)
-- =============================================================================


-- =============================================================================
-- 1. NGƯỜI DÙNG & XÁC THỰC
-- =============================================================================

-- 1.1 users — Tài khoản (V1, V8, V9)
CREATE TABLE users (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    phone               VARCHAR(15)  NOT NULL UNIQUE,      -- dùng để đăng nhập
    email               VARCHAR(150) UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,             -- BCrypt
    role                VARCHAR(20)  NOT NULL DEFAULT 'CUSTOMER',
                        -- CUSTOMER | OWNER | DRIVER | ADMIN (DRIVER có trong enum nhưng
                        -- tài xế thực tế không có tài khoản web, xem bảng drivers)
    verification_status VARCHAR(20)  DEFAULT 'UNVERIFIED',
                        -- UNVERIFIED | PENDING | VERIFIED | REJECTED (KYC)
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMP,
    address             VARCHAR(255),                       -- V8
    date_of_birth       DATE,                               -- V8
    avatar_url          VARCHAR(500),                       -- V9
    rejection_reason    TEXT,                               -- V9 (lý do từ chối KYC)
    last_login_at       TIMESTAMP,                          -- V9
    is_active           BOOLEAN DEFAULT TRUE                -- V9 (khóa / mở tài khoản)
);
CREATE INDEX idx_users_phone               ON users(phone);
CREATE INDEX idx_users_role                ON users(role);
CREATE INDEX idx_users_verification_status ON users(verification_status);
CREATE INDEX idx_users_email               ON users(email);

-- 1.2 user_documents — Ảnh KYC của khách (V15)
CREATE TABLE user_documents (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    document_type VARCHAR(30)  NOT NULL,  -- GPLX_FRONT | GPLX_BACK | CCCD_FRONT | CCCD_BACK | SELFIE
    document_url  VARCHAR(500) NOT NULL,
    uploaded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_docs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_user_docs_user ON user_documents(user_id);
CREATE INDEX idx_user_docs_type ON user_documents(document_type);

-- 1.3 password_reset_otps — OTP đặt lại mật khẩu (V27)
--     [App] OTP 6 số, hết hạn sau 5 phút, tối đa 5 lần nhập sai, gửi lại sau 60 giây
--     (OtpServiceImpl). Không có FK: tra theo số điện thoại.
CREATE TABLE password_reset_otps (
    id         BIGSERIAL PRIMARY KEY,
    phone      VARCHAR(15) NOT NULL,
    otp        VARCHAR(6)  NOT NULL,
    expires_at TIMESTAMP   NOT NULL,
    is_used    BOOLEAN     NOT NULL DEFAULT FALSE,
    attempts   INT         NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_otp_phone   ON password_reset_otps(phone);
CREATE INDEX idx_otp_expires ON password_reset_otps(expires_at);

-- 1.4 owner_requests — Hồ sơ đăng ký làm chủ xe (V21 + V33; V25 bị bỏ qua)
CREATE TABLE owner_requests (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT       NOT NULL,
    full_name         VARCHAR(100) NOT NULL,
    date_of_birth     DATE         NOT NULL,
    gender            VARCHAR(10)  NOT NULL,
    address           VARCHAR(255) NOT NULL,
    cccd              VARCHAR(12)  NOT NULL,
    cccd_issued_date  DATE         NOT NULL,
    cccd_issued_place VARCHAR(100) NOT NULL,
    bank_name         VARCHAR(100) NOT NULL,
    bank_account      VARCHAR(50)  NOT NULL,
    account_holder    VARCHAR(100) NOT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',  -- PENDING | APPROVED | REJECTED
    rejection_reason  TEXT,
    processed_by      BIGINT,                                    -- Admin xử lý
    processed_at      TIMESTAMP,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at        TIMESTAMP,                                 -- V33 (soft delete)
    CONSTRAINT fk_owner_req_user         FOREIGN KEY (user_id)      REFERENCES users(id),
    CONSTRAINT fk_owner_req_processed_by FOREIGN KEY (processed_by) REFERENCES users(id)  -- V33
);
CREATE INDEX idx_owner_req_user    ON owner_requests(user_id);
CREATE INDEX idx_owner_req_status  ON owner_requests(status);
CREATE INDEX idx_owner_req_deleted ON owner_requests(deleted_at);  -- V33

-- 1.5 owner_request_documents — Ảnh giấy tờ đính kèm hồ sơ chủ xe (V21)
--     [App] Loại hợp lệ: CCCD_FRONT, CCCD_BACK, GPLX_FRONT, GPLX_BACK, GPKD_FRONT,
--     GPKD_BACK, SELFIE; bắt buộc đủ CCCD 2 mặt + (GPKD hoặc GPLX 2 mặt).
CREATE TABLE owner_request_documents (
    id            BIGSERIAL PRIMARY KEY,
    request_id    BIGINT       NOT NULL,
    document_type VARCHAR(30)  NOT NULL,
    document_url  VARCHAR(500) NOT NULL,
    uploaded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_owner_doc_req FOREIGN KEY (request_id) REFERENCES owner_requests(id) ON DELETE CASCADE
);
CREATE INDEX idx_owner_doc_req ON owner_request_documents(request_id);


-- =============================================================================
-- 2. XE
-- =============================================================================

-- 2.1 cars — Thông tin xe (V2 + V30)
CREATE TABLE cars (
    id                    BIGSERIAL PRIMARY KEY,
    owner_id              BIGINT       NOT NULL,
    plate                 VARCHAR(20)  NOT NULL UNIQUE,
    brand                 VARCHAR(50)  NOT NULL,
    model                 VARCHAR(100) NOT NULL,
    year                  INT          NOT NULL,            -- [App] 1990..2100
    seats                 INT          NOT NULL,            -- [App] chỉ nhận 4, 5 hoặc 7 (CarRequest, ExcelImportService)
    transmission          VARCHAR(20)  NOT NULL,            -- MANUAL | AUTOMATIC
    fuel_type             VARCHAR(20)  NOT NULL,            -- GASOLINE | DIESEL | ELECTRIC | HYBRID
    color                 VARCHAR(30),
    current_km            INT          NOT NULL DEFAULT 0,
    price_per_day         BIGINT       NOT NULL,            -- giá ngày thường (VNĐ)
    price_weekend         BIGINT,                           -- giá T7/CN, áp dụng theo TỪNG ngày thuê
    price_holiday         BIGINT,                           -- lưu được nhưng chưa dùng khi tính giá
    extra_km_price        BIGINT DEFAULT 5000,              -- không dùng khi tính phí km (dùng config 3 bậc)
    delivery_fee          BIGINT DEFAULT 100000,
    cleaning_fee          BIGINT DEFAULT 0,
    car_type              VARCHAR(20)  NOT NULL,            -- SEDAN | SUV | MPV | HATCHBACK | PICKUP | VAN | LUXURY
    status                VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
                          -- PENDING | AVAILABLE | RENTED | MAINTENANCE | BROKEN | INACTIVE | REJECTED
    rental_mode           VARCHAR(20)  NOT NULL DEFAULT 'SELF_DRIVE',  -- SELF_DRIVE | WITH_DRIVER | BOTH
    address               VARCHAR(255),
    delivery_radius       INT DEFAULT 20,
    description           TEXT,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at            TIMESTAMP,
    base_km_per_day       INT    DEFAULT 300,               -- V30 (lưu theo xe; phí km dùng config default_km_per_day)
    deposit_percent       INT    DEFAULT 30,                -- V30 (lưu theo xe; tiền cọc dùng config default_deposit_percent)
    insurance_fee_per_day BIGINT DEFAULT 100000,            -- V30 (lưu theo xe; phí bảo hiểm dùng config insurance_fee_per_day)
    price_with_driver     BIGINT,                           -- V30
    CONSTRAINT fk_cars_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);
CREATE INDEX idx_cars_owner    ON cars(owner_id);
CREATE INDEX idx_cars_plate    ON cars(plate);
CREATE INDEX idx_cars_status   ON cars(status);
CREATE INDEX idx_cars_car_type ON cars(car_type);

-- 2.2 car_images — Ảnh xe (V2)
CREATE TABLE car_images (
    id            BIGSERIAL PRIMARY KEY,
    car_id        BIGINT       NOT NULL,
    image_url     VARCHAR(500) NOT NULL,
    image_type    VARCHAR(30),                -- entity khai báo length = 20
    display_order INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_car_images_car FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);
CREATE INDEX idx_car_images_car ON car_images(car_id);

-- 2.3 car_documents — Giấy tờ xe (V2)
--     [App] document_type: registration | inspection | insurance_liability |
--     insurance_physical | <doc_type tùy ý>. Cột verified luôn được ghi FALSE.
CREATE TABLE car_documents (
    id            BIGSERIAL PRIMARY KEY,
    car_id        BIGINT       NOT NULL,
    document_type VARCHAR(50)  NOT NULL,
    document_url  VARCHAR(500) NOT NULL,
    expiry_date   DATE,
    verified      BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_car_documents_car FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);
CREATE INDEX idx_car_documents_car  ON car_documents(car_id);
CREATE INDEX idx_car_documents_type ON car_documents(document_type);

-- 2.4 car_blocked_dates — Lịch chủ xe tự chặn (V31)
--     [App] BookingServiceImpl.createBooking từ chối đơn trùng khoảng chặn.
CREATE TABLE car_blocked_dates (
    id         BIGSERIAL PRIMARY KEY,
    car_id     BIGINT NOT NULL,
    start_date DATE   NOT NULL,
    end_date   DATE   NOT NULL,
    reason     VARCHAR(50) DEFAULT 'maintenance',   -- maintenance | personal | booked | other
    note       TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_blocked_dates_car FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);
CREATE INDEX idx_blocked_dates_car   ON car_blocked_dates(car_id);
CREATE INDEX idx_blocked_dates_range ON car_blocked_dates(car_id, start_date, end_date);


-- =============================================================================
-- 3. TÀI XẾ (khai báo trước bookings để tiện đọc; bookings.driver_id KHÔNG có FK)
-- =============================================================================

-- 3.1 drivers — Tài xế thuộc chủ xe (V5 + V34). Tài xế không có tài khoản web.
CREATE TABLE drivers (
    id               BIGSERIAL PRIMARY KEY,
    owner_id         BIGINT       NOT NULL,
    name             VARCHAR(100) NOT NULL,
    phone            VARCHAR(15)  NOT NULL UNIQUE,   -- nhận Magic Link (SMS giả lập)
    email            VARCHAR(150),
    cccd             VARCHAR(20),
    license_number   VARCHAR(30)  NOT NULL,
    license_class    VARCHAR(10)  NOT NULL,
    license_expiry   DATE,
    date_of_birth    DATE,
    address          VARCHAR(255),
    experience_years INT DEFAULT 0,
    avatar_url       VARCHAR(500),
    status           VARCHAR(20)  NOT NULL DEFAULT 'PENDING',  -- PENDING | ACTIVE | BUSY | INACTIVE | REJECTED
    rating           DOUBLE PRECISION DEFAULT 0,
    total_trips      INT DEFAULT 0,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at       TIMESTAMP,
    rejection_reason TEXT,                                      -- V34
    CONSTRAINT fk_drivers_owner FOREIGN KEY (owner_id) REFERENCES users(id)
);
CREATE INDEX idx_drivers_owner  ON drivers(owner_id);
CREATE INDEX idx_drivers_phone  ON drivers(phone);
CREATE INDEX idx_drivers_status ON drivers(status);


-- =============================================================================
-- 4. ĐẶT XE & THANH TOÁN
-- =============================================================================

-- 4.1 bookings — Đơn đặt xe (V3)
--     Vòng đời: PENDING → PAID → APPROVED → RENTED → RETURNED → COMPLETED
--               (CANCELLED từ PENDING / PAID / APPROVED)
CREATE TABLE bookings (
    id                 BIGSERIAL PRIMARY KEY,
    customer_id        BIGINT    NOT NULL,
    car_id             BIGINT    NOT NULL,
    owner_id           BIGINT    NOT NULL,
    start_date         TIMESTAMP NOT NULL,
    end_date           TIMESTAMP NOT NULL,
    actual_return_date TIMESTAMP,
    pickup_address     VARCHAR(255),
    return_address     VARCHAR(255),
    rental_mode        VARCHAR(20) NOT NULL DEFAULT 'SELF_DRIVE',
    driver_id          BIGINT,                 -- tham chiếu logic tới drivers.id (không khai báo FK)
    total_price        BIGINT NOT NULL,        -- cộng thêm phí trễ / vượt km / phát sinh khi ký biên bản trả xe
    deposit_amount     BIGINT NOT NULL,        -- = total × default_deposit_percent (30%)
    remaining_amount   BIGINT NOT NULL,
    status             VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    customer_note      TEXT,
    owner_note         TEXT,
    cancel_reason      TEXT,
    cancelled_at       TIMESTAMP,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_bookings_car      FOREIGN KEY (car_id)      REFERENCES cars(id),
    CONSTRAINT fk_bookings_owner    FOREIGN KEY (owner_id)    REFERENCES users(id)
);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_car      ON bookings(car_id);
CREATE INDEX idx_bookings_owner    ON bookings(owner_id);
CREATE INDEX idx_bookings_status   ON bookings(status);
CREATE INDEX idx_bookings_dates    ON bookings(start_date, end_date);

-- 4.2 booking_details — Bảng kê phí của đơn (V3)
CREATE TABLE booking_details (
    id            BIGSERIAL PRIMARY KEY,
    booking_id    BIGINT NOT NULL,
    rental_days   INT    NOT NULL,     -- làm tròn lên theo khối 24h, tối thiểu 1
    price_per_day BIGINT NOT NULL,     -- đơn giá của ngày nhận xe (hiển thị)
    rental_fee    BIGINT NOT NULL,     -- tổng giá từng ngày (T7/CN dùng giá cuối tuần)
    delivery_fee  BIGINT DEFAULT 0,
    insurance_fee BIGINT DEFAULT 0,    -- config insurance_fee_per_day (100.000đ/ngày)
    driver_fee    BIGINT DEFAULT 0,    -- config driver_fee_per_day (500.000đ/ngày)
    discount      BIGINT DEFAULT 0,
    extra_fee     BIGINT DEFAULT 0,
    note          TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_details_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);
CREATE INDEX idx_booking_details_booking ON booking_details(booking_id);

-- 4.3 payments — Giao dịch thanh toán (V4)
CREATE TABLE payments (
    id                     BIGSERIAL PRIMARY KEY,
    booking_id             BIGINT NOT NULL,
    customer_id            BIGINT NOT NULL,
    amount                 BIGINT NOT NULL,          -- server tự tính lại, không tin số tiền client gửi
    payment_method         VARCHAR(30) NOT NULL,     -- MOMO | ZALOPAY | VNPAY | BANKING (chỉ MoMo có gateway, sandbox)
    transaction_id         VARCHAR(100) UNIQUE,
    gateway_transaction_id VARCHAR(100),
    payment_type           VARCHAR(20) NOT NULL DEFAULT 'DEPOSIT',  -- DEPOSIT | FULL | REMAINING
    status                 VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING | SUCCESS | FAILED | CANCELLED | REFUNDED
    payment_url            VARCHAR(500),
    signature              VARCHAR(500),
    gateway_response       TEXT,
    paid_at                TIMESTAMP,
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_booking  FOREIGN KEY (booking_id)  REFERENCES bookings(id),
    CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id) REFERENCES users(id)
);
CREATE INDEX idx_payments_booking     ON payments(booking_id);
CREATE INDEX idx_payments_customer    ON payments(customer_id);
CREATE INDEX idx_payments_status      ON payments(status);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);
CREATE INDEX idx_payments_method      ON payments(payment_method);

-- 4.4 refunds — Yêu cầu hoàn tiền cọc, chờ Admin duyệt (V4)
CREATE TABLE refunds (
    id                    BIGSERIAL PRIMARY KEY,
    payment_id            BIGINT NOT NULL,
    booking_id            BIGINT NOT NULL,
    amount                BIGINT NOT NULL,
    reason                TEXT,
    status                VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING | SUCCESS (duyệt) | CANCELLED (từ chối)
    refund_transaction_id VARCHAR(100),
    processed_at          TIMESTAMP,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id) REFERENCES payments(id),
    CONSTRAINT fk_refunds_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
);
CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_refunds_booking ON refunds(booking_id);
CREATE INDEX idx_refunds_status  ON refunds(status);

-- 4.5 driver_assignments — Lượt phân công tài xế qua Magic Link (V12)
--     [App] Hạn phản hồi 3 giờ; tối đa 5 lượt / đơn; quá hạn → EXPIRED và gán tài xế kế tiếp.
CREATE TABLE driver_assignments (
    id             BIGSERIAL PRIMARY KEY,
    booking_id     BIGINT      NOT NULL,
    driver_id      BIGINT      NOT NULL,
    token          VARCHAR(64) NOT NULL UNIQUE,                 -- token của Magic Link
    status         VARCHAR(20) NOT NULL DEFAULT 'PENDING',      -- PENDING | ACCEPTED | REJECTED | EXPIRED | CANCELLED
    reject_reason  VARCHAR(255),
    deadline_at    TIMESTAMP   NOT NULL,
    responded_at   TIMESTAMP,
    attempt_number INT DEFAULT 1,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assignment_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_assignment_driver  FOREIGN KEY (driver_id)  REFERENCES drivers(id)
);
CREATE INDEX idx_assignment_booking         ON driver_assignments(booking_id);
CREATE INDEX idx_assignment_driver          ON driver_assignments(driver_id);
CREATE INDEX idx_assignment_status          ON driver_assignments(status);
CREATE INDEX idx_assignment_token           ON driver_assignments(token);
CREATE INDEX idx_assignment_status_deadline ON driver_assignments(status, deadline_at);


-- =============================================================================
-- 5. GIAO NHẬN & TƯƠNG TÁC
-- =============================================================================

-- 5.1 handover_records — Biên bản giao xe (PICKUP) / nhận lại xe (RETURN)
--     (V7 + V16 + V18 + V24 + V35)
CREATE TABLE handover_records (
    id                 BIGSERIAL PRIMARY KEY,
    booking_id         BIGINT      NOT NULL,
    handover_type      VARCHAR(20) NOT NULL,    -- PICKUP | RETURN
    km_reading         INT,                     -- chỉ số ODO
    fuel_level         SMALLINT,                -- 0-100 (%)
    exterior_note      TEXT,
    interior_note      TEXT,
    damages            TEXT,                    -- V35: JSONB → TEXT (chuỗi JSON)
    extra_fees         DECIMAL(12,0) DEFAULT 0,
    extra_fees_note    TEXT,
    owner_signature    TEXT,                    -- V16: VARCHAR(500) → TEXT
    customer_signature TEXT,                    -- V16: VARCHAR(500) → TEXT
    owner_signed_at    TIMESTAMP,
    customer_signed_at TIMESTAMP,
    record_hash        VARCHAR(64),             -- băm nội dung biên bản (chống sửa sau khi ký)
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at         TIMESTAMP,
    status             VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- V16: PENDING | SIGNED | CANCELLED
    actual_return_time TIMESTAMP,                               -- V18 (chỉ RETURN)
    late_fee           NUMERIC(12,0) DEFAULT 0,                 -- V18 phí trả xe trễ
    late_minutes       INT DEFAULT 0,                           -- V18
    km_driven          INT,                                     -- V24
    km_allowed         INT,                                     -- V24 = default_km_per_day × số ngày
    km_overage         INT DEFAULT 0,                           -- V24
    km_overage_fee     NUMERIC(12,0) DEFAULT 0,                 -- V24 phí vượt km 3 bậc
    CONSTRAINT fk_handover_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT uk_booking_type UNIQUE (booking_id, handover_type)
);
CREATE INDEX idx_handover_booking ON handover_records(booking_id);
CREATE INDEX idx_handover_type    ON handover_records(handover_type);
CREATE INDEX idx_handover_status  ON handover_records(status);

-- 5.2 handover_images — Ảnh hiện trạng xe kèm biên bản (V7)
CREATE TABLE handover_images (
    id          BIGSERIAL PRIMARY KEY,
    handover_id BIGINT       NOT NULL,
    image_url   VARCHAR(500) NOT NULL,
    image_type  VARCHAR(20) DEFAULT 'OTHER',   -- SCRATCH, DENT, INTERIOR, FUEL, DASHBOARD, OTHER, PICKUP, RETURN...
    note        VARCHAR(255),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_image_handover FOREIGN KEY (handover_id) REFERENCES handover_records(id) ON DELETE CASCADE
);
CREATE INDEX idx_image_handover ON handover_images(handover_id);

-- 5.3 reviews — Đánh giá sau chuyến (V5 + V28 + V36)
--     [App] Chỉ khi đơn COMPLETED; mỗi đơn 1 đánh giá; sao 1..5.
CREATE TABLE reviews (
    id                  BIGSERIAL PRIMARY KEY,
    booking_id          BIGINT NOT NULL,
    customer_id         BIGINT NOT NULL,
    car_id              BIGINT NOT NULL,
    owner_id            BIGINT NOT NULL,
    car_rating          INT    NOT NULL,
    owner_rating        INT    NOT NULL,
    comment             TEXT,
    is_anonymous        BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    driver_rating       INT,                     -- V28 (đơn có tài xế)
    images              TEXT,                    -- V28
    owner_reply         TEXT,                    -- V28 (phản hồi đầu tiên của chủ xe — kiểu cũ)
    replied_at          TIMESTAMP,               -- V28
    customer_reply      TEXT,                    -- V36
    customer_replied_at TIMESTAMP,               -- V36
    CONSTRAINT fk_reviews_booking  FOREIGN KEY (booking_id)  REFERENCES bookings(id),
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES users(id),
    CONSTRAINT fk_reviews_car      FOREIGN KEY (car_id)      REFERENCES cars(id),
    CONSTRAINT fk_reviews_owner    FOREIGN KEY (owner_id)    REFERENCES users(id)
);
CREATE INDEX idx_reviews_booking  ON reviews(booking_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
CREATE INDEX idx_reviews_car      ON reviews(car_id);
CREATE INDEX idx_reviews_owner    ON reviews(owner_id);

-- 5.4 review_replies — Hội thoại nhiều lượt khách ↔ chủ xe dưới đánh giá (V37)
CREATE TABLE review_replies (
    id          BIGSERIAL PRIMARY KEY,
    review_id   BIGINT      NOT NULL,
    author_id   BIGINT      NOT NULL,       -- không khai báo FK tới users
    author_role VARCHAR(20) NOT NULL,
    content     TEXT        NOT NULL,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,
    CONSTRAINT fk_review_replies_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    CONSTRAINT chk_review_replies_role  CHECK (author_role IN ('CUSTOMER', 'OWNER'))
);
CREATE INDEX idx_review_replies_review ON review_replies(review_id, created_at);

-- 5.5 disputes — Tranh chấp sau chuyến (V6 + V13 + V14)
--     [App] Chỉ tạo cho đơn COMPLETED, bởi khách hoặc chủ xe của đơn.
--     Trạng thái: PENDING | COUNTER_FILED | WAITING_EVIDENCE | READY_TO_FINALIZE |
--                 APPROVED_RAISER | APPROVED_AGAINST | ACCEPTED | RESOLVED | CLOSED
--     Hạn phản tố 48h (counter_deadline_at), hạn bổ sung bằng chứng 24h (review_deadline_at).
CREATE TABLE disputes (
    id                     BIGSERIAL PRIMARY KEY,
    dispute_code           VARCHAR(20) NOT NULL UNIQUE,   -- "DSP-XXXXXXXX"
    booking_id             BIGINT      NOT NULL,
    raised_by              BIGINT      NOT NULL,
    against_user           BIGINT      NOT NULL,
    category               VARCHAR(30) NOT NULL,          -- damage | late_return | overage_km | no_show | payment | behavior | other
    description            TEXT        NOT NULL,
    evidence               JSONB,
    claimed_amount         DECIMAL(12,0),
    status                 VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    resolution             TEXT,
    resolved_amount        DECIMAL(12,0),
    resolved_by            BIGINT,
    resolved_at            TIMESTAMP,
    deadline_at            TIMESTAMP,
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at             TIMESTAMP,
    admin_request          TEXT,                          -- V13 yêu cầu bổ sung của Admin
    evidence_history       JSONB,                         -- V13
    last_submitted_at      TIMESTAMP,                     -- V13
    counter_description    TEXT,                          -- V14 phản tố của bên bị khiếu nại
    counter_evidence       JSONB,                         -- V14
    counter_filed_at       TIMESTAMP,                     -- V14
    counter_deadline_at    TIMESTAMP,                     -- V14 (+48h khi tạo)
    review_deadline_at     TIMESTAMP,                     -- V14 (+24h khi Admin yêu cầu bổ sung)
    awaiting_response_from VARCHAR(20),                   -- V14 RAISER | AGAINST | BOTH
    contract_url           VARCHAR(500),                  -- V14 biên bản phán xử PDF (PDFBox)
    contract_generated_at  TIMESTAMP,                     -- V14
    CONSTRAINT fk_disputes_booking     FOREIGN KEY (booking_id)   REFERENCES bookings(id),
    CONSTRAINT fk_disputes_raised_by   FOREIGN KEY (raised_by)    REFERENCES users(id),
    CONSTRAINT fk_disputes_against     FOREIGN KEY (against_user) REFERENCES users(id),
    CONSTRAINT fk_disputes_resolved_by FOREIGN KEY (resolved_by)  REFERENCES users(id)
);
CREATE INDEX idx_disputes_booking           ON disputes(booking_id);
CREATE INDEX idx_disputes_status            ON disputes(status);
CREATE INDEX idx_disputes_raised_by         ON disputes(raised_by);
CREATE INDEX idx_disputes_last_submitted    ON disputes(last_submitted_at);
CREATE INDEX idx_disputes_counter_deadline  ON disputes(counter_deadline_at) WHERE counter_deadline_at IS NOT NULL;
CREATE INDEX idx_disputes_awaiting_response ON disputes(awaiting_response_from);

-- 5.6 notifications — Thông báo trong ứng dụng (V5)
--     Không có WebSocket/email: frontend gọi /notifications/unread-count mỗi 30 giây.
CREATE TABLE notifications (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT       NOT NULL,
    title        VARCHAR(255) NOT NULL,
    content      TEXT         NOT NULL,
    type         VARCHAR(30)  NOT NULL,   -- NotificationType: BOOKING_*, PAYMENT_*, REFUND_*, CAR_*, DRIVER_*,
                                          -- HANDOVER_*, REVIEW_*, DISPUTE_*, WITHDRAWAL_*, VERIFICATION_*,
                                          -- OWNER_REQUEST_*, SYSTEM, SYSTEM_BROADCAST
    reference_id BIGINT,
    is_read      BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX idx_notifications_user    ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type    ON notifications(type);


-- =============================================================================
-- 6. QUẢN TRỊ
-- =============================================================================

-- 6.1 withdrawals — Yêu cầu rút tiền của chủ xe (V6 + V17)
--     [App] Tối thiểu min_withdrawal; cần ≥ 1 đơn COMPLETED; số dư = Σ total_price
--     đơn COMPLETED × (100% − commission_rate) − các lệnh PENDING/COMPLETED.
CREATE TABLE withdrawals (
    id             BIGSERIAL PRIMARY KEY,
    owner_id       BIGINT        NOT NULL,
    amount         DECIMAL(12,0) NOT NULL,
    bank_name      VARCHAR(100)  NOT NULL,
    bank_account   VARCHAR(50)   NOT NULL,
    account_holder VARCHAR(100)  NOT NULL,
    status         VARCHAR(20)   NOT NULL DEFAULT 'PENDING',   -- PENDING | COMPLETED (Admin duyệt) | REJECTED
    reject_reason  VARCHAR(255),
    processed_by   BIGINT,
    processed_at   TIMESTAMP,
    transaction_id VARCHAR(100),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at     TIMESTAMP,
    fee            NUMERIC(12,0) DEFAULT 0,                    -- V17 snapshot phí rút
    net_amount     NUMERIC(12,0) NOT NULL,                     -- V17 = amount − fee
    CONSTRAINT fk_withdrawals_owner        FOREIGN KEY (owner_id)     REFERENCES users(id),
    CONSTRAINT fk_withdrawals_processed_by FOREIGN KEY (processed_by) REFERENCES users(id)
);
CREATE INDEX idx_withdrawals_owner  ON withdrawals(owner_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);

-- 6.2 platform_config — Cấu hình nền tảng dạng key/value (V6)
--     Backend cache trong bộ nhớ (ConfigHelper, TTL 60 giây), xóa cache khi Admin cập nhật.
CREATE TABLE platform_config (
    id           BIGSERIAL PRIMARY KEY,
    config_key   VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT         NOT NULL,
    config_type  VARCHAR(20)  NOT NULL DEFAULT 'STRING',   -- STRING | NUMBER ...
    description  VARCHAR(255),
    updated_by   BIGINT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_config_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);
CREATE INDEX idx_config_key ON platform_config(config_key);

-- 6.3 approval_logs — Nhật ký duyệt hồ sơ (V6). target_type/target_id là tham chiếu đa hình.
CREATE TABLE approval_logs (
    id          BIGSERIAL PRIMARY KEY,
    target_type VARCHAR(30) NOT NULL,
    target_id   BIGINT      NOT NULL,
    action      VARCHAR(20) NOT NULL,
    reason      TEXT,
    approved_by BIGINT      NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_approval_approved_by FOREIGN KEY (approved_by) REFERENCES users(id)
);
CREATE INDEX idx_approval_target      ON approval_logs(target_type, target_id);
CREATE INDEX idx_approval_approved_by ON approval_logs(approved_by);


-- =============================================================================
-- 7. DỮ LIỆU CẤU HÌNH — TRẠNG THÁI CUỐI SAU V37 (17 dòng)
-- =============================================================================
-- Nguồn: V6 (8 dòng, trong đó default_overage_km_price bị V23 xóa),
--        V19 (5 dòng, trong đó refund_owner_reject_percent bị V22 xóa — chủ xe từ
--        chối luôn hoàn 100%), V20 (14 dòng km theo loại xe, bị V23 xóa hết),
--        V23 (6 dòng km theo bậc, áp dụng mọi loại xe).
INSERT INTO platform_config (config_key, config_value, config_type, description) VALUES
('commission_rate',             '15',                    'NUMBER', 'Tỷ lệ hoa hồng nền tảng (%)'),
('min_withdrawal',              '100000',                'NUMBER', 'Số tiền rút tối thiểu (VNĐ)'),
('withdrawal_fee',              '0',                     'NUMBER', 'Phí rút tiền (VNĐ)'),
('default_deposit_percent',     '30',                    'NUMBER', 'Tỷ lệ cọc mặc định (%)'),
('default_late_fee_per_hour',   '100000',                'NUMBER', 'Phí trả muộn mỗi giờ (VNĐ)'),
('support_hotline',             '1900-xxxx',             'STRING', 'Hotline hỗ trợ'),
('support_email',               'support@carrental.com', 'STRING', 'Email hỗ trợ'),
('refund_before_24h_percent',   '100',                   'NUMBER', 'Hoàn cọc khi hủy trước 24h (%)'),
('refund_4_to_24h_percent',     '70',                    'NUMBER', 'Hoàn cọc khi hủy từ 4-24h (%)'),
('refund_before_4h_percent',    '50',                    'NUMBER', 'Hoàn cọc khi hủy dưới 4h (%)'),
('refund_after_pickup_percent', '0',                     'NUMBER', 'Hoàn cọc khi hủy sau giờ nhận (%)'),
('default_km_per_day',          '300',                   'NUMBER', 'Số km cơ bản mỗi ngày (áp dụng MỌI loại xe)'),
('km_overage_bracket_1_limit',  '50',                    'NUMBER', 'Mốc km vượt bậc 1 (VD: 50km đầu)'),
('km_overage_bracket_1_price',  '5000',                  'NUMBER', 'Phí km vượt bậc 1 (đ/km)'),
('km_overage_bracket_2_limit',  '100',                   'NUMBER', 'Mốc km vượt bậc 2 (VD: từ 50-100km)'),
('km_overage_bracket_2_price',  '8000',                  'NUMBER', 'Phí km vượt bậc 2 (đ/km)'),
('km_overage_bracket_3_price',  '12000',                 'NUMBER', 'Phí km vượt bậc 3 (vượt trên 100km) (đ/km)')
ON CONFLICT (config_key) DO NOTHING;

-- Ghi chú cấu hình:
-- * Khóa CÓ giá trị mặc định trong code (ConfigHelper) nhưng KHÔNG được seed bởi
--   migration nào — Admin có thể tạo qua POST /admin/config:
--     max_km_overage_per_day = 500   (giới hạn km vượt tối đa / ngày, chống nhập nhầm ODO)
--     max_total_km_overage   = 2000  (giới hạn tổng km vượt / chuyến)
-- * Đang được bổ sung song song (KHÔNG thuộc V1..V37, không nằm trong snapshot này):
--   V38__add_fee_configs.sql sẽ thêm
--     insurance_fee_per_day = 100000
--     driver_fee_per_day    = 500000
--   PricingService đọc hai khóa này qua ConfigHelper (mặc định 100.000đ / 500.000đ nếu chưa có dòng).

-- =============================================================================
-- 8. DỮ LIỆU MẪU (chỉ liệt kê, xem migration để có lệnh INSERT đầy đủ)
-- =============================================================================
-- * V10 (+ V11, V29 đồng bộ mật khẩu): 3 tài khoản, mật khẩu chung Admin@123
--     0900000001  admin@carrental.com     ADMIN    VERIFIED
--     0900000002  owner@carrental.com     OWNER    VERIFIED
--     0900000003  customer@carrental.com  CUSTOMER VERIFIED
-- * V26: 14 xe AVAILABLE của owner id = 2 (1 xe 4 chỗ, 9 xe 5 chỗ, 4 xe 7 chỗ).
-- * V32: 3 tài xế ACTIVE thuộc chủ xe 0900000002.
-- =============================================================================
