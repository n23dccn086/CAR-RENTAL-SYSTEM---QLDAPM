-- V36: Cho phép khách hàng trả lời lại phản hồi của chủ xe trên đánh giá
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_reply TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS customer_replied_at TIMESTAMP;
