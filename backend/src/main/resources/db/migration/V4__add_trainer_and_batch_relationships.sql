-- V4: Add trainer and batch relational columns to guarantee relational integrity

-- Add trainer_id to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS trainer_id VARCHAR(64);

-- Add course_id to student_course_batches
ALTER TABLE student_course_batches ADD COLUMN IF NOT EXISTS course_id VARCHAR(128);

-- Add batch_id to enrollments
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS batch_id VARCHAR(128);
