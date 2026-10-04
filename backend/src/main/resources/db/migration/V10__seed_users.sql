-- ============================================================
-- V10: SEED DEFAULT USERS (ADMIN + DEMO ACCOUNTS)
-- ============================================================
-- Password cho tất cả: Admin@123
-- BCrypt hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

INSERT INTO users (name, phone, email, password_hash, role, verification_status, is_active)
VALUES
-- 1. ADMIN
('Admin System', '0900000001', 'admin@carrental.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 'ADMIN', 'VERIFIED', true),

-- 2. OWNER mẫu
('Nguyễn Văn Chủ', '0900000002', 'owner@carrental.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 'OWNER', 'VERIFIED', true),

-- 3. CUSTOMER mẫu
('Trần Thị Khách', '0900000003', 'customer@carrental.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 'CUSTOMER', 'VERIFIED', true)
ON CONFLICT (phone) DO NOTHING;