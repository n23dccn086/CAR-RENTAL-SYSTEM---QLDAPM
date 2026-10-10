-- ============================================================
-- V29: ĐỒNG NHẤT MẬT KHẨU TẤT CẢ TÀI KHOẢN TEST: Admin@123
-- ============================================================

UPDATE users 
SET password_hash = '$2a$12$yNyr32l968Qvo1hA4kgKs.kHdAM4UpjoB.hInAOwYMwNkRH0ob37S'
WHERE phone IN ('0900000001', '0900000002', '0900000003');
