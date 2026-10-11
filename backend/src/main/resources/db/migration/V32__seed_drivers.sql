-- ============================================================
-- V32: SEED DRIVERS FOR TESTING
-- Tạo tài xế mẫu cho owner@carrental.com (0900000002)
-- Dùng subquery để lấy owner_id chính xác trên mọi máy
-- ============================================================

-- Tài xế 1: Lê Thị C — ACTIVE
INSERT INTO drivers (
    owner_id, name, phone, email, cccd,
    license_number, license_class, license_expiry,
    date_of_birth, address, experience_years,
    status, rating, total_trips
)
SELECT 
    u.id, 'Lê Thị C', '0903333333', 'c@example.com', '112233445566',
    '555666777', 'B1', '2027-03-15',
    '1990-01-01', 'Quận 5, TP.HCM', 3,
    'ACTIVE', 4.5, 0
FROM users u
WHERE u.phone = '0900000002'
  AND NOT EXISTS (SELECT 1 FROM drivers d WHERE d.phone = '0903333333')
ON CONFLICT (phone) DO NOTHING;

-- Tài xế 2: Trần Văn B — ACTIVE
INSERT INTO drivers (
    owner_id, name, phone, email, cccd,
    license_number, license_class, license_expiry,
    date_of_birth, address, experience_years,
    status, rating, total_trips
)
SELECT 
    u.id, 'Trần Văn B', '0902222222', 'b@example.com', '098765432109',
    '987654321', 'C', '2027-06-30',
    '1980-10-20', 'Quận 3, TP.HCM', 10,
    'ACTIVE', 4.8, 0
FROM users u
WHERE u.phone = '0900000002'
  AND NOT EXISTS (SELECT 1 FROM drivers d WHERE d.phone = '0902222222')
ON CONFLICT (phone) DO NOTHING;

-- Tài xế 3: Nguyễn Văn D — ACTIVE
INSERT INTO drivers (
    owner_id, name, phone, email, cccd,
    license_number, license_class, license_expiry,
    date_of_birth, address, experience_years,
    status, rating, total_trips
)
SELECT 
    u.id, 'Nguyễn Văn D', '0904444444', NULL, '223344556677',
    '111222333', 'B2', '2026-12-31',
    '1995-07-15', 'Quận 1, TP.HCM', 5,
    'ACTIVE', 4.2, 0
FROM users u
WHERE u.phone = '0900000002'
  AND NOT EXISTS (SELECT 1 FROM drivers d WHERE d.phone = '0904444444')
ON CONFLICT (phone) DO NOTHING;