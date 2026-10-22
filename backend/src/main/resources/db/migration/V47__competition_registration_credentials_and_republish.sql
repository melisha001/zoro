-- Migration V47: Competition registration credentials and assessment republishing
-- 1. Add encrypted_password to competition_registrations for admin-viewable credential support
ALTER TABLE competition_registrations
    ADD COLUMN IF NOT EXISTS encrypted_password VARCHAR(512);

-- 2. Add publish_version and republished_at to competition_assessments
ALTER TABLE competition_assessments
    ADD COLUMN IF NOT EXISTS publish_version INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS republished_at TIMESTAMPTZ;

-- 3. Add publish_version to assessment_attempts
ALTER TABLE assessment_attempts
    ADD COLUMN IF NOT EXISTS publish_version INT NOT NULL DEFAULT 1;

-- 4. Update assessment_attempts unique constraint to include publish_version so students can attempt republished versions
ALTER TABLE assessment_attempts
    DROP CONSTRAINT IF EXISTS uq_assess_attempt_reg;

ALTER TABLE assessment_attempts
    ADD CONSTRAINT uq_assess_attempt_reg_ver UNIQUE (assessment_id, registration_id, publish_version);

-- 5. Add index for faster query by assessment, registration and version
CREATE INDEX IF NOT EXISTS idx_assess_attempts_reg_ver
    ON assessment_attempts(assessment_id, registration_id, publish_version);
