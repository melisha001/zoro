-- Migration V26: Add SHA-256 hash and reference counting for Bunny storage deduplication, and system settings
ALTER TABLE stored_files ADD COLUMN IF NOT EXISTS sha256_hash VARCHAR(64);
ALTER TABLE stored_files ADD COLUMN IF NOT EXISTS ref_count INT DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_stored_files_sha256 ON stored_files(sha256_hash);

-- System Settings table for configurable policies such as submission retention
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO system_settings (setting_key, setting_value)
VALUES ('submission_retention_months', '0')
ON CONFLICT (setting_key) DO NOTHING;
