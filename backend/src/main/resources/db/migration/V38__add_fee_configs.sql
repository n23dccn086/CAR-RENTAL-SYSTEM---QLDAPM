-- V38: Đưa phí bảo hiểm và phí tài xế (trước đây hard-code trong PricingService) vào cấu hình nền tảng,
-- để Admin điều chỉnh trên trang Cấu hình và áp dụng ngay (ConfigHelper.clearCache).
INSERT INTO platform_config (config_key, config_value, config_type, description) VALUES
('insurance_fee_per_day', '100000', 'NUMBER', 'Phí bảo hiểm mỗi ngày thuê (VND)'),
('driver_fee_per_day',    '500000', 'NUMBER', 'Phí thuê tài xế mỗi ngày (VND)')
ON CONFLICT (config_key) DO NOTHING;
