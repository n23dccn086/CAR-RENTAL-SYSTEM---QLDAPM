-- V23: Xóa config km phân loại xe cũ, thêm config mới theo mốc km
DELETE FROM platform_config WHERE config_key LIKE 'km_per_day_%';
DELETE FROM platform_config WHERE config_key LIKE 'km_overage_price_%';
DELETE FROM platform_config WHERE config_key = 'default_overage_km_price';

-- Thêm config mới: chỉ theo mốc km, áp dụng MỌI loại xe
INSERT INTO platform_config (config_key, config_value, config_type, description) VALUES
('default_km_per_day', '300', 'NUMBER', 'Số km cơ bản mỗi ngày (áp dụng MỌI loại xe)'),
('km_overage_bracket_1_limit', '50', 'NUMBER', 'Mốc km vượt bậc 1 (VD: 50km đầu)'),
('km_overage_bracket_1_price', '5000', 'NUMBER', 'Phí km vượt bậc 1 (đ/km)'),
('km_overage_bracket_2_limit', '100', 'NUMBER', 'Mốc km vượt bậc 2 (VD: từ 50-100km)'),
('km_overage_bracket_2_price', '8000', 'NUMBER', 'Phí km vượt bậc 2 (đ/km)'),
('km_overage_bracket_3_price', '12000', 'NUMBER', 'Phí km vượt bậc 3 (vượt trên 100km) (đ/km)')
ON CONFLICT (config_key) DO NOTHING;