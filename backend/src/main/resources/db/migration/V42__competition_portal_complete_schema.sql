-- V42: Competition Portal Complete Schema for Phase 1 & 2 (Exam Engine, Evaluation & Leaderboard)

-- 1. Competitions: Add timestamp, scheduling and review columns
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS reg_start_at TIMESTAMPTZ;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS reg_end_at TIMESTAMPTZ;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS final_unlock_at TIMESTAMPTZ;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS leaderboard_publish_time VARCHAR(20);
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS leaderboard_status VARCHAR(50) NOT NULL DEFAULT 'NOT_PUBLISHED';
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS leaderboard_published_at TIMESTAMPTZ;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS answer_review_enabled BOOLEAN NOT NULL DEFAULT false;

-- Backfill timestamps from existing string dates where available (assuming Asia/Kolkata +05:30)
UPDATE competitions
SET start_at = (start_date || ' 00:00:00+05:30')::TIMESTAMPTZ
WHERE start_date ~ '^\d{4}-\d{2}-\d{2}$' AND start_at IS NULL;

UPDATE competitions
SET end_at = (end_date || ' 23:59:59+05:30')::TIMESTAMPTZ
WHERE end_date ~ '^\d{4}-\d{2}-\d{2}$' AND end_at IS NULL;

UPDATE competitions
SET reg_start_at = (reg_start_date || ' 00:00:00+05:30')::TIMESTAMPTZ
WHERE reg_start_date ~ '^\d{4}-\d{2}-\d{2}$' AND reg_start_at IS NULL;

UPDATE competitions
SET reg_end_at = (reg_end_date || ' 23:59:59+05:30')::TIMESTAMPTZ
WHERE reg_end_date ~ '^\d{4}-\d{2}-\d{2}$' AND reg_end_at IS NULL;

-- 2. Competition Syllabus
CREATE TABLE IF NOT EXISTS competition_syllabus (
    id VARCHAR(64) PRIMARY KEY,
    competition_id VARCHAR(128) NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    stored_file_id VARCHAR(64) REFERENCES stored_files(id) ON DELETE SET NULL,
    file_type VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_competition_syllabus UNIQUE (competition_id)
);
CREATE INDEX IF NOT EXISTS idx_comp_syllabus_comp_id ON competition_syllabus(competition_id);

-- 3. Competition Guidance Videos
CREATE TABLE IF NOT EXISTS competition_guidance_videos (
    id VARCHAR(64) PRIMARY KEY,
    competition_id VARCHAR(128) NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    bunny_video_id VARCHAR(128) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Ready',
    duration VARCHAR(50),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_comp_guidance_videos_comp_id ON competition_guidance_videos(competition_id);

-- 4. Competition Study Materials
CREATE TABLE IF NOT EXISTS competition_study_materials (
    id VARCHAR(64) PRIMARY KEY,
    competition_id VARCHAR(128) NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    stored_file_id VARCHAR(64) REFERENCES stored_files(id) ON DELETE SET NULL,
    file_type VARCHAR(50),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_comp_materials_comp_id ON competition_study_materials(competition_id);

-- 5. Competition Sets (A-D)
CREATE TABLE IF NOT EXISTS competition_sets (
    id VARCHAR(64) PRIMARY KEY,
    competition_id VARCHAR(128) NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    trainer_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_competition_sets UNIQUE (competition_id, code)
);
CREATE INDEX IF NOT EXISTS idx_comp_sets_comp_id ON competition_sets(competition_id);

-- 6. Competition Set Members
CREATE TABLE IF NOT EXISTS competition_set_members (
    id VARCHAR(64) PRIMARY KEY,
    competition_id VARCHAR(128) NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    registration_id VARCHAR(128) NOT NULL UNIQUE REFERENCES competition_registrations(id) ON DELETE CASCADE,
    set_id VARCHAR(64) NOT NULL REFERENCES competition_sets(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_comp_set_members_reg_id ON competition_set_members(registration_id);
CREATE INDEX IF NOT EXISTS idx_comp_set_members_set_id ON competition_set_members(set_id);

-- 7. Competition Assessments (Test Series, Mock, Final)
CREATE TABLE IF NOT EXISTS competition_assessments (
    id VARCHAR(64) PRIMARY KEY,
    competition_id VARCHAR(128) NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    sequence_no INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    duration_minutes INT NOT NULL DEFAULT 30,
    total_marks INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_comp_assess_seq UNIQUE (competition_id, type, sequence_no)
);
CREATE INDEX IF NOT EXISTS idx_comp_assess_lookup ON competition_assessments(competition_id, type, status);

-- 8. Assessment Questions
CREATE TABLE IF NOT EXISTS assessment_questions (
    id VARCHAR(64) PRIMARY KEY,
    assessment_id VARCHAR(64) NOT NULL REFERENCES competition_assessments(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    question_format VARCHAR(50) NOT NULL DEFAULT 'MCQ',
    question_text TEXT NOT NULL,
    media_ref VARCHAR(255),
    answer_format VARCHAR(50) NOT NULL DEFAULT 'MCQ_OPTIONS',
    marks INT NOT NULL DEFAULT 1,
    explanation TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assess_questions_assess_id ON assessment_questions(assessment_id);

-- 9. Question Options (Stable UUID for option id)
CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id VARCHAR(64) NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_correct BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_question_options_q_id ON question_options(question_id);

-- 10. Assessment Set Questions (Pre-generated Final Assessment Papers)
CREATE TABLE IF NOT EXISTS assessment_set_questions (
    id VARCHAR(64) PRIMARY KEY,
    assessment_id VARCHAR(64) NOT NULL REFERENCES competition_assessments(id) ON DELETE CASCADE,
    set_id VARCHAR(64) NOT NULL REFERENCES competition_sets(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    position INT NOT NULL,
    CONSTRAINT uq_assess_set_q UNIQUE (assessment_id, set_id, question_id)
);

-- 11. Assessment Set Options (Pre-generated Final Assessment Options)
CREATE TABLE IF NOT EXISTS assessment_set_options (
    id VARCHAR(64) PRIMARY KEY,
    assessment_id VARCHAR(64) NOT NULL REFERENCES competition_assessments(id) ON DELETE CASCADE,
    set_id VARCHAR(64) NOT NULL REFERENCES competition_sets(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES question_options(id) ON DELETE CASCADE,
    position INT NOT NULL,
    CONSTRAINT uq_assess_set_opt UNIQUE (assessment_id, set_id, question_id, option_id)
);

-- 12. Assessment Attempts
CREATE TABLE IF NOT EXISTS assessment_attempts (
    id VARCHAR(64) PRIMARY KEY,
    assessment_id VARCHAR(64) NOT NULL REFERENCES competition_assessments(id) ON DELETE CASCADE,
    registration_id VARCHAR(128) NOT NULL REFERENCES competition_registrations(id) ON DELETE CASCADE,
    set_id VARCHAR(64) REFERENCES competition_sets(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED',
    started_at TIMESTAMPTZ,
    deadline_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    mcq_marks NUMERIC(8,2) DEFAULT 0,
    voice_marks NUMERIC(8,2) DEFAULT 0,
    total_marks NUMERIC(8,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_assess_attempt_reg UNIQUE (assessment_id, registration_id)
);
CREATE INDEX IF NOT EXISTS idx_assess_attempts_reg ON assessment_attempts(registration_id);

-- 13. Attempt Answers
CREATE TABLE IF NOT EXISTS attempt_answers (
    id VARCHAR(64) PRIMARY KEY,
    attempt_id VARCHAR(64) NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
    audio_file_id VARCHAR(64) REFERENCES stored_files(id) ON DELETE SET NULL,
    duration_seconds INT,
    marks_awarded NUMERIC(8,2),
    trainer_feedback TEXT,
    evaluated_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    evaluated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_attempt_answer_q UNIQUE (attempt_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON attempt_answers(attempt_id);

-- 14. Assessment Evaluation Criteria
CREATE TABLE IF NOT EXISTS assessment_evaluation_criteria (
    id VARCHAR(64) PRIMARY KEY,
    question_id VARCHAR(64) NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    max_marks INT NOT NULL DEFAULT 5,
    sort_order INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_eval_criteria_q ON assessment_evaluation_criteria(question_id);

-- 15. Competition Results
CREATE TABLE IF NOT EXISTS competition_results (
    id VARCHAR(64) PRIMARY KEY,
    competition_id VARCHAR(128) NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    registration_id VARCHAR(128) NOT NULL REFERENCES competition_registrations(id) ON DELETE CASCADE,
    total_marks NUMERIC(8,2) NOT NULL DEFAULT 0,
    rank INT,
    percentile NUMERIC(6,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_comp_result_reg UNIQUE (competition_id, registration_id)
);
CREATE INDEX IF NOT EXISTS idx_comp_results_comp_rank ON competition_results(competition_id, rank);

-- 16. Competition Leaderboard Cache
CREATE TABLE IF NOT EXISTS competition_leaderboard_cache (
    id VARCHAR(64) PRIMARY KEY,
    competition_id VARCHAR(128) NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    registration_id VARCHAR(128) NOT NULL REFERENCES competition_registrations(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    set_code VARCHAR(10),
    total_marks NUMERIC(8,2) NOT NULL DEFAULT 0,
    rank INT NOT NULL,
    percentile NUMERIC(6,2),
    last_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_lb_cache_reg UNIQUE (competition_id, registration_id)
);
CREATE INDEX IF NOT EXISTS idx_comp_lb_cache_comp ON competition_leaderboard_cache(competition_id, rank);

-- Backfill 4 Sets (A, B, C, D) for all existing competitions
INSERT INTO competition_sets (id, competition_id, code)
SELECT 'set_' || c.id || '_A', c.id, 'A'
FROM competitions c
ON CONFLICT (competition_id, code) DO NOTHING;

INSERT INTO competition_sets (id, competition_id, code)
SELECT 'set_' || c.id || '_B', c.id, 'B'
FROM competitions c
ON CONFLICT (competition_id, code) DO NOTHING;

INSERT INTO competition_sets (id, competition_id, code)
SELECT 'set_' || c.id || '_C', c.id, 'C'
FROM competitions c
ON CONFLICT (competition_id, code) DO NOTHING;

INSERT INTO competition_sets (id, competition_id, code)
SELECT 'set_' || c.id || '_D', c.id, 'D'
FROM competitions c
ON CONFLICT (competition_id, code) DO NOTHING;

-- Backfill 35 TEST_SERIES, 4 MOCK, 1 FINAL assessment slots as DRAFT for existing competitions
DO $$
DECLARE
    comp RECORD;
    i INT;
BEGIN
    FOR comp IN SELECT id FROM competitions LOOP
        -- 35 Test Series
        FOR i IN 1..35 LOOP
            INSERT INTO competition_assessments (id, competition_id, type, sequence_no, title, status, duration_minutes, total_marks)
            VALUES ('asmt_' || comp.id || '_ts_' || i, comp.id, 'TEST_SERIES', i, 'Test Series ' || i, 'DRAFT', 20, 20)
            ON CONFLICT (competition_id, type, sequence_no) DO NOTHING;
        END LOOP;

        -- 4 Mocks
        FOR i IN 1..4 LOOP
            INSERT INTO competition_assessments (id, competition_id, type, sequence_no, title, status, duration_minutes, total_marks)
            VALUES ('asmt_' || comp.id || '_mock_' || i, comp.id, 'MOCK', i, 'Mock Test ' || i, 'DRAFT', 45, 50)
            ON CONFLICT (competition_id, type, sequence_no) DO NOTHING;
        END LOOP;

        -- 1 Final Assessment
        INSERT INTO competition_assessments (id, competition_id, type, sequence_no, title, status, duration_minutes, total_marks)
        VALUES ('asmt_' || comp.id || '_final_1', comp.id, 'FINAL', 1, 'Final Assessment', 'DRAFT', 60, 100)
        ON CONFLICT (competition_id, type, sequence_no) DO NOTHING;
    END LOOP;
END $$;
