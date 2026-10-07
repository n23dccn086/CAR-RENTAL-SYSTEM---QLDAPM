-- V20: Config km vượt theo loại xe
INSERT INTO platform_config (config_key, config_value, config_type, description) VALUES
-- Km/ngày cơ bản
('km_per_day_sedan',    '300', 'NUMBER', 'Km/ngày cho Sedan'),
('km_per_day_suv',      '350', 'NUMBER', 'Km/ngày cho SUV'),
('km_per_day_mpv',      '400', 'NUMBER', 'Km/ngày cho MPV'),
('km_per_day_luxury',   '250', 'NUMBER', 'Km/ngày cho Luxury'),
('km_per_day_hatchback','300', 'NUMBER', 'Km/ngày cho Hatchback'),
('km_per_day_pickup',   '250', 'NUMBER', 'Km/ngày cho Pickup'),
('km_per_day_van',      '400', 'NUMBER', 'Km/ngày cho Van'),

-- Phí vượt km (đ/km)
('km_overage_price_sedan',    '5000',  'NUMBER', 'Phí vượt km Sedan (đ/km)'),
('km_overage_price_suv',      '7000',  'NUMBER', 'Phí vượt km SUV (đ/km)'),
('km_overage_price_mpv',      '8000',  'NUMBER', 'Phí vượt km MPV (đ/km)'),
('km_overage_price_luxury',   '10000', 'NUMBER', 'Phí vượt km Luxury (đ/km)'),
('km_overage_price_hatchback','5000',  'NUMBER', 'Phí vượt km Hatchback (đ/km)'),
('km_overage_price_pickup',   '10000', 'NUMBER', 'Phí vượt km Pickup (đ/km)'),
('km_overage_price_van',      '8000',  'NUMBER', 'Phí vượt km Van (đ/km)')
ON CONFLICT (config_key) DO NOTHING;