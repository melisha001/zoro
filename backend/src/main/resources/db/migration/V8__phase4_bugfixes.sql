-- V8: Phase 4 Bug Fixes
-- 1. Deduplicate competition registrations if any duplicates exist before creating unique index
DELETE FROM competition_registrations a USING competition_registrations b
WHERE a.id > b.id
  AND a.competition_id = b.competition_id
  AND LOWER(a.student_email) = LOWER(b.student_email);

-- Unique index on (competition_id, student_email)
CREATE UNIQUE INDEX IF NOT EXISTS uk_comp_reg_comp_email
    ON competition_registrations(competition_id, LOWER(student_email));

-- 2. Add slug column to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug VARCHAR(160);

-- Backfill slugs for existing courses from title
UPDATE courses
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'))
WHERE slug IS NULL OR slug = '';

-- Ensure unique slug constraint
CREATE UNIQUE INDEX IF NOT EXISTS uk_courses_slug ON courses(slug);

-- 3. Student module progress table for server-side video watch progress
CREATE TABLE IF NOT EXISTS student_module_progress (
    id VARCHAR(128) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL,
    module_id VARCHAR(128) NOT NULL,
    course_id VARCHAR(128),
    watched_seconds INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_position_seconds INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_student_module_prog UNIQUE (student_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_student_module_prog_student ON student_module_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_module_prog_module ON student_module_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_student_module_prog_course ON student_module_progress(course_id);
