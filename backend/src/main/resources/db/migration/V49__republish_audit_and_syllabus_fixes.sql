-- V49: Republish audit table and index updates

CREATE TABLE IF NOT EXISTS republish_audit (
    id VARCHAR(64) PRIMARY KEY,
    assessment_id VARCHAR(64) NOT NULL REFERENCES competition_assessments(id) ON DELETE CASCADE,
    admin_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    republished_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_attempts_count INT NOT NULL DEFAULT 0,
    deleted_answers_count INT NOT NULL DEFAULT 0,
    deleted_recordings_count INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_republish_audit_asmt ON republish_audit(assessment_id);
CREATE INDEX IF NOT EXISTS idx_republish_audit_date ON republish_audit(republished_at);
