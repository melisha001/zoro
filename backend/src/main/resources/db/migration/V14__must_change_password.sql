-- Flyway V14: Add must_change_password column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;
UPDATE users SET must_change_password = FALSE WHERE must_change_password IS NULL;
