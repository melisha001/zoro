-- Migration V9: Neutralize default seed user passwords
-- Invalidate known seed passwords so that default/compromised accounts cannot be used.

UPDATE users
SET password = '$2a$10$LOCKED_' || md5(random()::text || id || clock_timestamp()::text)
WHERE password = '$2a$10$N.Zvh7Ie8B8jO/x7X18Q8u0lJdJgA5z0W7tF2kK1h0uT8G9p9aUqa'
   OR id IN ('usr-admin-1', 'trn-1', 'trn-2', 'std-1', 'std-2');
