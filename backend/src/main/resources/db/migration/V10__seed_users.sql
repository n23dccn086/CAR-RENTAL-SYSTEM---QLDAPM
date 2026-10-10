-- ============================================================
-- V10: SEED DEFAULT USERS (ADMIN + DEMO ACCOUNTS)
-- ============================================================
-- Password cho tất cả: Admin@123
-- BCrypt hash (cost 12): $2a$12$yNyr32l968Qvo1hA4kgKs.kHdAM4UpjoB.hInAOwYMwNkRH0ob37S

INSERT INTO users (name, phone, email, password_hash, role, verification_status, is_active)
VALUES
-- 1. ADMIN
('Admin System', '0900000001', 'admin@carrental.com',
 '$2a$12$yNyr32l968Qvo1hA4kgKs.kHdAM4UpjoB.hInAOwYMwNkRH0ob37S',
 'ADMIN', 'VERIFIED', true),

-- 2. OWNER mẫu
('Nguyễn Văn Chủ', '0900000002', 'owner@carrental.com',
 '$2a$12$yNyr32l968Qvo1hA4kgKs.kHdAM4UpjoB.hInAOwYMwNkRH0ob37S',
 'OWNER', 'VERIFIED', true),

-- 3. CUSTOMER mẫu
('Trần Thị Khách', '0900000003', 'customer@carrental.com',
 '$2a$12$yNyr32l968Qvo1hA4kgKs.kHdAM4UpjoB.hInAOwYMwNkRH0ob37S',
 'CUSTOMER', 'VERIFIED', true)
ON CONFLICT (phone) DO NOTHING;