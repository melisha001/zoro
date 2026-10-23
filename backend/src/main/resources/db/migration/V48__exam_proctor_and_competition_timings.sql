-- V48: Exam Proctor Events and Competition Timings Support

CREATE TABLE IF NOT EXISTS exam_proctor_events (
    id VARCHAR(64) PRIMARY KEY,
    attempt_id VARCHAR(128) NOT NULL,
    candidate_id VARCHAR(128),
    event_type VARCHAR(64) NOT NULL,
    event_count INT DEFAULT 1,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proctor_events_attempt_id ON exam_proctor_events(attempt_id);
CREATE INDEX IF NOT EXISTS idx_proctor_events_candidate_id ON exam_proctor_events(candidate_id);

-- Widen leaderboard_publish_time to support both HH:mm and YYYY-MM-DDTHH:mm
ALTER TABLE competitions ALTER COLUMN leaderboard_publish_time TYPE VARCHAR(64);

-- Add proctoring violation tracking columns to assessment_attempts
ALTER TABLE assessment_attempts ADD COLUMN IF NOT EXISTS proctor_violation_count INT DEFAULT 0;
ALTER TABLE assessment_attempts ADD COLUMN IF NOT EXISTS auto_submitted BOOLEAN DEFAULT FALSE;
