-- V6: IDs as Single Source of Truth, backfilling, normalization, foreign keys and unique constraints

-- 1. Add missing ID columns
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS trainer_id VARCHAR(64);

ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS student_id VARCHAR(64);
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS trainer_id VARCHAR(64);
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS assignment_id VARCHAR(128);
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS batch_id VARCHAR(128);

ALTER TABLE doubts ADD COLUMN IF NOT EXISTS trainer_id VARCHAR(64);

ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS course_id VARCHAR(128);
ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS batch_id VARCHAR(128);

-- 2. Normalise student_id from email/name to users.id
UPDATE enrollments e
SET student_id = u.id
FROM users u
WHERE (e.student_id = u.email OR LOWER(e.student_email) = LOWER(u.email))
  AND e.student_id != u.id;

UPDATE attendance_records a
SET student_id = u.id
FROM users u
WHERE (a.student_id = u.email OR (a.student_id NOT IN (SELECT id FROM users) AND LOWER(a.student_name) = LOWER(u.name)))
  AND a.student_id != u.id;

UPDATE student_progress sp
SET student_id = u.id
FROM users u
WHERE (sp.student_id = u.email OR LOWER(sp.student_id) = LOWER(u.email))
  AND sp.student_id != u.id;

UPDATE student_fees sf
SET student_id = u.id
FROM users u
WHERE (sf.student_id = u.email OR (sf.student_id NOT IN (SELECT id FROM users) AND LOWER(sf.student_name) = LOWER(u.name)))
  AND sf.student_id != u.id;

UPDATE doubts d
SET student_id = u.id
FROM users u
WHERE (d.student_id = u.email OR (d.student_id NOT IN (SELECT id FROM users) AND LOWER(d.student_name) = LOWER(u.name)))
  AND d.student_id != u.id;

UPDATE student_course_batches scb
SET student_id = u.id
FROM users u
WHERE scb.student_id = u.email
  AND scb.student_id != u.id;

UPDATE competition_registrations cr
SET student_id = u.id
FROM users u
WHERE (cr.student_id = u.email OR LOWER(cr.student_email) = LOWER(u.email))
  AND cr.student_id != u.id;

-- 3. Backfill missing IDs from names and references
-- Assignments
UPDATE assignments a
SET course_id = c.id
FROM courses c
WHERE a.course_id IS NULL AND LOWER(a.course) = LOWER(c.title);

UPDATE assignments a
SET batch_id = b.id
FROM batches b
WHERE a.batch_id IS NULL AND LOWER(a.batch) = LOWER(b.name);

UPDATE assignments a
SET trainer_id = u.id
FROM users u
WHERE a.trainer_id IS NULL
  AND LOWER(a.trainer) = LOWER(u.name)
  AND u.role = 'TRAINER';

UPDATE assignments a
SET trainer_id = c.trainer_id
FROM courses c
WHERE a.trainer_id IS NULL
  AND a.course_id = c.id
  AND c.trainer_id IS NOT NULL;

-- Assignment Submissions
UPDATE assignment_submissions s
SET student_id = u.id
FROM users u
WHERE s.student_id IS NULL
  AND (LOWER(s.student_email) = LOWER(u.email) OR LOWER(s.student_name) = LOWER(u.name));

UPDATE assignment_submissions s
SET assignment_id = a.id
FROM assignments a
WHERE s.assignment_id IS NULL
  AND LOWER(s.assignment_title) = LOWER(a.title);

UPDATE assignment_submissions s
SET course_id = a.course_id
FROM assignments a
WHERE s.course_id IS NULL
  AND s.assignment_id = a.id
  AND a.course_id IS NOT NULL;

UPDATE assignment_submissions s
SET course_id = c.id
FROM courses c
WHERE s.course_id IS NULL
  AND LOWER(s.course_title) = LOWER(c.title);

UPDATE assignment_submissions s
SET batch_id = b.id
FROM batches b
WHERE s.batch_id IS NULL
  AND LOWER(s.batch_name) = LOWER(b.name);

UPDATE assignment_submissions s
SET trainer_id = u.id
FROM users u
WHERE s.trainer_id IS NULL
  AND (LOWER(s.assigned_trainer) = LOWER(u.name) OR LOWER(s.corrected_by) = LOWER(u.name))
  AND u.role = 'TRAINER';

UPDATE assignment_submissions s
SET trainer_id = a.trainer_id
FROM assignments a
WHERE s.trainer_id IS NULL
  AND s.assignment_id = a.id
  AND a.trainer_id IS NOT NULL;

-- Doubts
UPDATE doubts d
SET course_id = c.id
FROM courses c
WHERE d.course_id IS NULL AND LOWER(d.course_title) = LOWER(c.title);

UPDATE doubts d
SET trainer_id = u.id
FROM users u
WHERE d.trainer_id IS NULL
  AND LOWER(d.trainer_name) = LOWER(u.name)
  AND u.role = 'TRAINER';

UPDATE doubts d
SET trainer_id = c.trainer_id
FROM courses c
WHERE d.trainer_id IS NULL
  AND d.course_id = c.id
  AND c.trainer_id IS NOT NULL;

-- Student Fees
UPDATE student_fees sf
SET course_id = c.id
FROM courses c
WHERE sf.course_id IS NULL AND LOWER(sf.course) = LOWER(c.title);

UPDATE student_fees sf
SET batch_id = b.id
FROM batches b
WHERE sf.batch_id IS NULL AND LOWER(sf.batch) = LOWER(b.name);

-- Student Course Batches
UPDATE student_course_batches scb
SET course_id = c.id
FROM courses c
WHERE scb.course_id IS NULL AND LOWER(scb.course_name) = LOWER(c.title);

UPDATE student_course_batches scb
SET batch_id = b.id
FROM batches b
WHERE scb.batch_id IS NULL AND LOWER(scb.batch_name) = LOWER(b.name);

-- 4. Temporary table reporting unmatched records
CREATE TEMP TABLE IF NOT EXISTS unmatched_migration_records (
    table_name VARCHAR(100),
    record_id VARCHAR(128),
    details TEXT
);

INSERT INTO unmatched_migration_records (table_name, record_id, details)
SELECT 'assignments', id, 'Missing trainer_id for trainer: ' || COALESCE(trainer, 'NULL')
FROM assignments WHERE trainer_id IS NULL;

INSERT INTO unmatched_migration_records (table_name, record_id, details)
SELECT 'assignment_submissions', id, 'Missing student_id for: ' || COALESCE(student_email, student_name, 'NULL')
FROM assignment_submissions WHERE student_id IS NULL;

INSERT INTO unmatched_migration_records (table_name, record_id, details)
SELECT 'student_fees', id, 'Missing course_id for: ' || COALESCE(course, 'NULL')
FROM student_fees WHERE course_id IS NULL;

-- 5. Deduplicate before applying UNIQUE constraints
DELETE FROM enrollments
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY student_id, course_id ORDER BY created_at DESC, id DESC) as rnum
        FROM enrollments
        WHERE student_id IS NOT NULL AND course_id IS NOT NULL
    ) t WHERE t.rnum > 1
);

DELETE FROM student_course_batches
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY student_id, course_id ORDER BY id DESC) as rnum
        FROM student_course_batches
        WHERE student_id IS NOT NULL AND course_id IS NOT NULL
    ) t WHERE t.rnum > 1
);

DELETE FROM attendance_records
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY student_id, schedule_id ORDER BY created_at DESC, id DESC) as rnum
        FROM attendance_records
        WHERE student_id IS NOT NULL AND schedule_id IS NOT NULL
    ) t WHERE t.rnum > 1
);

-- 6. Add Unique Constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_enrollments_student_course') THEN
        ALTER TABLE enrollments ADD CONSTRAINT uk_enrollments_student_course UNIQUE (student_id, course_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_scb_student_course') THEN
        ALTER TABLE student_course_batches ADD CONSTRAINT uk_scb_student_course UNIQUE (student_id, course_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_attendance_student_schedule') THEN
        ALTER TABLE attendance_records ADD CONSTRAINT uk_attendance_student_schedule UNIQUE (student_id, schedule_id);
    END IF;
END $$;

-- 7. Foreign Keys (ON DELETE RESTRICT)
-- Clean orphans before creating constraints
UPDATE enrollments SET course_id = NULL WHERE course_id NOT IN (SELECT id FROM courses);
UPDATE enrollments SET student_id = NULL WHERE student_id NOT IN (SELECT id FROM users);
UPDATE assignments SET trainer_id = NULL WHERE trainer_id NOT IN (SELECT id FROM users);
UPDATE assignment_submissions SET student_id = NULL WHERE student_id NOT IN (SELECT id FROM users);
UPDATE assignment_submissions SET trainer_id = NULL WHERE trainer_id NOT IN (SELECT id FROM users);
UPDATE doubts SET student_id = NULL WHERE student_id NOT IN (SELECT id FROM users);
UPDATE doubts SET trainer_id = NULL WHERE trainer_id NOT IN (SELECT id FROM users);
UPDATE student_fees SET student_id = NULL WHERE student_id NOT IN (SELECT id FROM users);
UPDATE student_fees SET course_id = NULL WHERE course_id NOT IN (SELECT id FROM courses);

-- Change enrollments.course_id constraint from CASCADE to RESTRICT
DO $$
BEGIN
    ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_course_id_fkey;
    ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS fk_enrollments_course;
    ALTER TABLE enrollments ADD CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_enrollments_student') THEN
        ALTER TABLE enrollments ADD CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_assignments_trainer') THEN
        ALTER TABLE assignments ADD CONSTRAINT fk_assignments_trainer FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_submissions_student') THEN
        ALTER TABLE assignment_submissions ADD CONSTRAINT fk_submissions_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_submissions_trainer') THEN
        ALTER TABLE assignment_submissions ADD CONSTRAINT fk_submissions_trainer FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_doubts_student') THEN
        ALTER TABLE doubts ADD CONSTRAINT fk_doubts_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_doubts_trainer') THEN
        ALTER TABLE doubts ADD CONSTRAINT fk_doubts_trainer FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_fees_student') THEN
        ALTER TABLE student_fees ADD CONSTRAINT fk_fees_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_fees_course') THEN
        ALTER TABLE student_fees ADD CONSTRAINT fk_fees_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- 8. Competition Registrations: payment_status default to 'Pending' (not 'Paid')
ALTER TABLE competition_registrations ALTER COLUMN payment_status SET DEFAULT 'Pending';
