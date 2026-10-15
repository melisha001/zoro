-- V33: Drop days and session from batches table
ALTER TABLE batches DROP COLUMN IF EXISTS days;
ALTER TABLE batches DROP COLUMN IF EXISTS session;
