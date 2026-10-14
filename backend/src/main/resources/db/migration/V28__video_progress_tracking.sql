-- V28__video_progress_tracking.sql
-- Add video progress tracking columns to student_module_progress

ALTER TABLE student_module_progress 
    ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS video_completed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_position INTEGER DEFAULT 0;

-- Backfill last_position from last_position_seconds if present
UPDATE student_module_progress 
SET last_position = COALESCE(last_position_seconds, 0)
WHERE last_position = 0 AND last_position_seconds IS NOT NULL;

-- Backfill video_completed from completed if present
UPDATE student_module_progress
SET video_completed = TRUE
WHERE completed = TRUE;
