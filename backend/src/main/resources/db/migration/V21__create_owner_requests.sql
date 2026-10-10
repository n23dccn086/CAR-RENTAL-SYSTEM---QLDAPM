-- V21: Owner registration requests
CREATE TABLE IF NOT EXISTS owner_requests (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    date_of_birth   DATE NOT NULL,
    gender          VARCHAR(10) NOT NULL,
    address         VARCHAR(255) NOT NULL,
    cccd            VARCHAR(12) NOT NULL,
    cccd_issued_date DATE NOT NULL,
    cccd_issued_place VARCHAR(100) NOT NULL,
    bank_name       VARCHAR(100) NOT NULL,
    bank_account    VARCHAR(50) NOT NULL,
    account_holder  VARCHAR(100) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    processed_by    BIGINT,
    processed_at    TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_owner_req_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_owner_req_user ON owner_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_owner_req_status ON owner_requests(status);

-- Bảng ảnh cho owner request
CREATE TABLE IF NOT EXISTS owner_request_documents (
    id              BIGSERIAL PRIMARY KEY,
    request_id      BIGINT NOT NULL,
    document_type   VARCHAR(30) NOT NULL,
    document_url    VARCHAR(500) NOT NULL,
    uploaded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_owner_doc_req FOREIGN KEY (request_id) REFERENCES owner_requests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_owner_doc_req ON owner_request_documents(request_id);