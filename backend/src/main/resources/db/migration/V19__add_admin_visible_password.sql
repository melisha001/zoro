-- V19: Add admin_visible_password column for reversible encryption of admin-set passwords
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_visible_password TEXT;
