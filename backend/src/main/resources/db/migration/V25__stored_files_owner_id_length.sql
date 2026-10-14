-- Migration V25: Widen stored_files column lengths for student/trainer IDs and paths
ALTER TABLE stored_files ALTER COLUMN id TYPE VARCHAR(64);
ALTER TABLE stored_files ALTER COLUMN owner_id TYPE VARCHAR(64);
ALTER TABLE stored_files ALTER COLUMN original_name TYPE VARCHAR(500);
ALTER TABLE stored_files ALTER COLUMN content_type TYPE VARCHAR(150);
ALTER TABLE stored_files ALTER COLUMN storage_path TYPE VARCHAR(1000);
