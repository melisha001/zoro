-- V41: Add origin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS origin VARCHAR(50) NOT NULL DEFAULT 'LEARNING';
CREATE INDEX IF NOT EXISTS idx_users_origin ON users(origin);

UPDATE users SET origin = 'LEARNING' WHERE origin IS NULL;
