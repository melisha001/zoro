-- V43: Competition Portal Engine Extensions
-- Schema completeness for Voice Evaluation, Result Corrections, Leaderboard Snapshot, and Attempt Tracking

-- 1. Assessment Questions: Guidance text & maximum recording duration for voice questions
ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS guidance_text TEXT;
ALTER TABLE assessment_questions ADD COLUMN IF NOT EXISTS max_duration_seconds INT NOT NULL DEFAULT 120;

-- 2. Attempt Answers: Voice tracking, evaluation status, evaluator ID, feedback and verification flags
ALTER TABLE attempt_answers ADD COLUMN IF NOT EXISTS voice_file_id VARCHAR(64) REFERENCES stored_files(id) ON DELETE SET NULL;
ALTER TABLE attempt_answers ADD COLUMN IF NOT EXISTS voice_duration_sec INT;
ALTER TABLE attempt_answers ADD COLUMN IF NOT EXISTS saved_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE attempt_answers ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;
ALTER TABLE attempt_answers ADD COLUMN IF NOT EXISTS evaluation_status VARCHAR(50) NOT NULL DEFAULT 'AUTO';
ALTER TABLE attempt_answers ADD COLUMN IF NOT EXISTS evaluator_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE attempt_answers ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Backfill existing attempt_answers columns
UPDATE attempt_answers
SET 
    voice_file_id = COALESCE(voice_file_id, audio_file_id),
    voice_duration_sec = COALESCE(voice_duration_sec, duration_seconds),
    evaluator_id = COALESCE(evaluator_id, evaluated_by),
    feedback = COALESCE(feedback, trainer_feedback),
    saved_at = COALESCE(saved_at, created_at);

-- 3. Voice Evaluation Scores: Per-criterion grading (Pronunciation, Fluency, Grammar, Content)
CREATE TABLE IF NOT EXISTS voice_evaluation_scores (
    id VARCHAR(64) PRIMARY KEY,
    answer_id VARCHAR(64) NOT NULL REFERENCES attempt_answers(id) ON DELETE CASCADE,
    criterion_id VARCHAR(64) NOT NULL REFERENCES assessment_evaluation_criteria(id) ON DELETE CASCADE,
    score NUMERIC(8,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_voice_eval_answer_criterion UNIQUE (answer_id, criterion_id)
);
CREATE INDEX IF NOT EXISTS idx_voice_eval_scores_answer ON voice_evaluation_scores(answer_id);
CREATE INDEX IF NOT EXISTS idx_voice_eval_scores_criterion ON voice_evaluation_scores(criterion_id);

-- 4. Result Corrections: Audit log for any manual score modifications by Admin
CREATE TABLE IF NOT EXISTS result_corrections (
    id VARCHAR(64) PRIMARY KEY,
    competition_id VARCHAR(128) NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    registration_id VARCHAR(128) NOT NULL REFERENCES competition_registrations(id) ON DELETE CASCADE,
    old_marks NUMERIC(8,2) NOT NULL,
    new_marks NUMERIC(8,2) NOT NULL,
    reason TEXT NOT NULL,
    changed_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_result_corrections_comp ON result_corrections(competition_id);
CREATE INDEX IF NOT EXISTS idx_result_corrections_reg ON result_corrections(registration_id);

-- 5. Leaderboard Snapshot & Cache extension
ALTER TABLE competition_leaderboard_cache ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id VARCHAR(64) PRIMARY KEY,
    competition_id VARCHAR(128) NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    registration_id VARCHAR(128) NOT NULL REFERENCES competition_registrations(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    set_code VARCHAR(10),
    total_marks NUMERIC(8,2) NOT NULL DEFAULT 0,
    rank INT NOT NULL,
    percentile NUMERIC(6,2),
    final_submitted_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_leaderboard_entries_comp_reg UNIQUE (competition_id, registration_id)
);
CREATE INDEX IF NOT EXISTS idx_lb_entries_comp_rank ON leaderboard_entries(competition_id, rank);

-- 6. Backfill existing competition timeline and leaderboard configurations
UPDATE competitions
SET 
    reg_start_at = COALESCE(reg_start_at, '2026-10-01 00:00:00+05:30'::TIMESTAMPTZ),
    reg_end_at = '2026-10-16 23:59:59+05:30'::TIMESTAMPTZ,
    start_at = '2026-10-17 00:00:00+05:30'::TIMESTAMPTZ,
    end_at = '2026-11-16 23:59:59+05:30'::TIMESTAMPTZ,
    final_unlock_at = '2026-11-15 10:00:00+05:30'::TIMESTAMPTZ,
    leaderboard_publish_time = '18:00',
    leaderboard_status = 'NOT_PUBLISHED'
WHERE id = 'comp_3d06fbf6-ef35-4ad7-83d0-b3d56846daf8';
