-- V45: Trainer Extra Assignments Target Audience and Targeting Fields
ALTER TABLE assignments 
    ADD COLUMN IF NOT EXISTS target_type VARCHAR(20) DEFAULT 'batch',
    ADD COLUMN IF NOT EXISTS target_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS target_student_ids TEXT,
    ADD COLUMN IF NOT EXISTS target_student_emails TEXT,
    ADD COLUMN IF NOT EXISTS target_student_names TEXT,
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
    ADD COLUMN IF NOT EXISTS creator_role VARCHAR(50) DEFAULT 'ADMIN';

-- Migrate any legacy 'course' target types or nulls safely to 'batch'
UPDATE assignments 
SET target_type = 'batch' 
WHERE target_type IS NULL OR target_type = 'course';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_target_type ON assignments(target_type);
CREATE INDEX IF NOT EXISTS idx_assignments_batch_id ON assignments(batch_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
