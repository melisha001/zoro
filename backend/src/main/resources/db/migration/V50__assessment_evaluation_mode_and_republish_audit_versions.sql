-- V50: Assessment evaluation mode and republish audit versions
ALTER TABLE assessment_attempts ADD COLUMN IF NOT EXISTS evaluation_mode VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_assess_attempts_eval_mode ON assessment_attempts(evaluation_mode);

ALTER TABLE republish_audit ADD COLUMN IF NOT EXISTS previous_version INT DEFAULT 1;
ALTER TABLE republish_audit ADD COLUMN IF NOT EXISTS new_version INT DEFAULT 2;
