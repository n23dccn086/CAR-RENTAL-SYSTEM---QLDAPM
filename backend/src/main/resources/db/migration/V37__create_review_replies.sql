-- V37: Hội thoại nhiều lượt giữa khách và chủ xe dưới mỗi đánh giá
-- (owner_reply / customer_reply cũ trên bảng reviews vẫn được giữ và hiển thị là các tin đầu tiên của luồng)
CREATE TABLE IF NOT EXISTS review_replies (
    id BIGSERIAL PRIMARY KEY,
    review_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    author_role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_review_replies_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    CONSTRAINT chk_review_replies_role CHECK (author_role IN ('CUSTOMER', 'OWNER'))
);

CREATE INDEX IF NOT EXISTS idx_review_replies_review ON review_replies(review_id, created_at);
