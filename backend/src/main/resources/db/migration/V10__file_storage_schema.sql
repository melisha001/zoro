-- Migration V10: File Storage schema
CREATE TABLE IF NOT EXISTS stored_files (
    id VARCHAR(36) PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL,
    owner_id VARCHAR(36),
    storage_path VARCHAR(500) NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stored_files_owner ON stored_files(owner_id);
CREATE INDEX IF NOT EXISTS idx_stored_files_category ON stored_files(category);
