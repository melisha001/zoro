-- V17: Add course_id column to enquiries table
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS course_id VARCHAR(128) REFERENCES courses(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_enquiries_course_id ON enquiries(course_id);
