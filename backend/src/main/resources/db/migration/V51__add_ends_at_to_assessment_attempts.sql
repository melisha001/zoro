-- V51: Add ends_at column to assessment_attempts for accurate server-managed countdown
ALTER TABLE assessment_attempts ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;
UPDATE assessment_attempts SET ends_at = deadline_at WHERE ends_at IS NULL AND deadline_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assess_attempts_ends_at ON assessment_attempts(ends_at);
