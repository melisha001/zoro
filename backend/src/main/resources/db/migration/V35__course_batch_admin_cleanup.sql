-- V35__course_batch_admin_cleanup.sql
-- Phase 3: Course, batch, and admin cleanup migration

-- 1. For existing Online/Hybrid courses that currently have a trainer assigned:
-- Clear courses.assigned_trainer, courses.trainer_id, and courses.assigned_trainer_id
-- ONLY where at least one batch with a non-null trainer already exists for that course.
UPDATE courses c
SET assigned_trainer = NULL,
    trainer_id = NULL,
    assigned_trainer_id = NULL
WHERE (LOWER(c.mode) = 'online' OR LOWER(c.mode) = 'hybrid')
  AND (c.assigned_trainer IS NOT NULL OR c.trainer_id IS NOT NULL OR c.assigned_trainer_id IS NOT NULL)
  AND EXISTS (
      SELECT 1 FROM batches b 
      WHERE b.course_id = c.id 
        AND (b.trainer_id IS NOT NULL OR b.trainer_name IS NOT NULL)
  );

-- 2. For existing Trainer-audience Recorded courses: set assigned_trainer = 'Admin' and trainer_id to the admin user's id.
UPDATE courses c
SET assigned_trainer = 'Admin',
    trainer_id = COALESCE((SELECT id FROM users WHERE LOWER(role) = 'admin' ORDER BY created_at ASC LIMIT 1), 'usr_admin_001'),
    assigned_trainer_id = COALESCE((SELECT id FROM users WHERE LOWER(role) = 'admin' ORDER BY created_at ASC LIMIT 1), 'usr_admin_001')
WHERE LOWER(c.audience) = 'trainer'
  AND LOWER(c.mode) = 'recorded';

-- 3. In batches, safely ensure days and session columns are dropped and backfilled if they still exist.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'batches' AND column_name = 'days'
    ) THEN
        UPDATE batches 
        SET name = COALESCE(NULLIF(name, ''), CONCAT('Batch - ', COALESCE(days, ''), ' ', COALESCE(session, '')))
        WHERE name IS NULL OR TRIM(name) = '';
        
        ALTER TABLE batches DROP COLUMN IF EXISTS days;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'batches' AND column_name = 'session'
    ) THEN
        ALTER TABLE batches DROP COLUMN IF EXISTS session;
    END IF;
END $$;
