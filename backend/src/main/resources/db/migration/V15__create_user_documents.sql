-- ============================================================
-- V15: USER DOCUMENTS (Ảnh GPLX, CCCD, selfie để xác thực)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_documents (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    document_type   VARCHAR(30) NOT NULL,  -- GPLX_FRONT, GPLX_BACK, CCCD_FRONT, CCCD_BACK, SELFIE
    document_url    VARCHAR(500) NOT NULL,
    uploaded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_docs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_docs_user ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_docs_type ON user_documents(document_type);