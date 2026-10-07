-- V19: Thêm config cho chính sách hoàn cọc
INSERT INTO platform_config (config_key, config_value, config_type, description) VALUES
('refund_before_24h_percent', '100', 'NUMBER', 'Hoàn cọc khi hủy trước 24h (%)'),
('refund_4_to_24h_percent',   '70',  'NUMBER', 'Hoàn cọc khi hủy từ 4-24h (%)'),
('refund_before_4h_percent',  '50',  'NUMBER', 'Hoàn cọc khi hủy dưới 4h (%)'),
('refund_after_pickup_percent', '0', 'NUMBER', 'Hoàn cọc khi hủy sau giờ nhận (%)'),
('refund_owner_reject_percent', '100', 'NUMBER', 'Hoàn cọc khi Owner từ chối (%)')
ON CONFLICT (config_key) DO NOTHING;