-- V32: Add Trainer Assignment Submissions and Review fields
ALTER TABLE assignment_submissions 
    ADD COLUMN IF NOT EXISTS submitter_role VARCHAR(20) DEFAULT 'STUDENT',
    ADD COLUMN IF NOT EXISTS reviewer VARCHAR(20) DEFAULT 'ADMIN',
    ADD COLUMN IF NOT EXISTS feedback TEXT,
    ADD COLUMN IF NOT EXISTS corrected_file_url VARCHAR(1000);

-- Backfill existing rows as STUDENT submitter_role
UPDATE assignment_submissions 
SET submitter_role = 'STUDENT' 
WHERE submitter_role IS NULL;

-- Create indexes for efficient role-based filtering
CREATE INDEX IF NOT EXISTS idx_submissions_submitter_role ON assignment_submissions(submitter_role);
CREATE INDEX IF NOT EXISTS idx_submissions_reviewer ON assignment_submissions(reviewer);
