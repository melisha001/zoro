-- V31: Add course_mode to doubts table and backfill from courses
ALTER TABLE doubts ADD COLUMN IF NOT EXISTS course_mode VARCHAR(50);

-- Backfill existing doubts from courses table
UPDATE doubts d
SET course_mode = c.mode
FROM courses c
WHERE d.course_id = c.id
  AND d.course_mode IS NULL;

-- Default any unlinked legacy doubts to 'Online'
UPDATE doubts
SET course_mode = 'Online'
WHERE course_mode IS NULL;
