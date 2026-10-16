-- V38: Trainer Attendance Table, Remark Tracking, and Idempotent Absent Backfill

-- 1. Add remark tracking columns to student attendance_records
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS remark_by VARCHAR(128);
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS remark_at TIMESTAMP WITHOUT TIME ZONE;

-- 2. Create dedicated trainer_attendance_records table
CREATE TABLE IF NOT EXISTS trainer_attendance_records (
    id VARCHAR(128) PRIMARY KEY,
    schedule_id VARCHAR(128) NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    trainer_id VARCHAR(64) NOT NULL,
    trainer_name VARCHAR(255),
    course_id VARCHAR(128),
    batch_id VARCHAR(128),
    date VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP WITHOUT TIME ZONE,
    remarks TEXT,
    remark_by VARCHAR(128),
    remark_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_trainer_attendance_schedule_trainer UNIQUE (schedule_id, trainer_id)
);

CREATE INDEX IF NOT EXISTS idx_trainer_att_schedule ON trainer_attendance_records(schedule_id);
CREATE INDEX IF NOT EXISTS idx_trainer_att_trainer ON trainer_attendance_records(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_att_date ON trainer_attendance_records(date);

-- 3. Migrate any legacy trainer records mistakenly stored in attendance_records
INSERT INTO trainer_attendance_records (id, schedule_id, trainer_id, trainer_name, course_id, batch_id, date, status, remarks, remark_by, created_at, updated_at)
SELECT
    'tratt_' || SUBSTRING(a.id FROM 5),
    a.schedule_id,
    a.student_id,
    a.student_name,
    a.course_id,
    a.batch_id,
    a.date,
    a.status,
    a.remarks,
    a.recorded_by,
    COALESCE(a.created_at, CURRENT_TIMESTAMP),
    COALESCE(a.created_at, CURRENT_TIMESTAMP)
FROM attendance_records a
JOIN schedules s ON s.id = a.schedule_id
WHERE a.student_id LIKE 'trn_%'
ON CONFLICT (schedule_id, trainer_id) DO NOTHING;

DELETE FROM attendance_records WHERE student_id LIKE 'trn_%';

-- 4. Idempotent backfill of ABSENT for past finished sessions (Online & Hybrid only)
-- Students:
INSERT INTO attendance_records (id, schedule_id, student_id, student_name, course_id, batch_id, date, status, recorded_by, created_at)
SELECT
    'att_' || md5(s.id || '_' || scb.student_id),
    s.id,
    scb.student_id,
    COALESCE(u.name, 'Student'),
    s.course_id,
    s.batch_id,
    s.date,
    'Absent',
    'SYSTEM_AUTO',
    CURRENT_TIMESTAMP
FROM schedules s
JOIN courses c ON c.id = s.course_id
JOIN student_course_batches scb ON (scb.batch_id = s.batch_id OR ((s.batch_id IS NULL OR s.batch_id = 'All' OR s.batch_id = '') AND scb.course_id = s.course_id))
LEFT JOIN users u ON u.id = scb.student_id
WHERE LOWER(c.mode) IN ('online', 'hybrid')
  AND (s.date < TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
       OR (s.date = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AND s.end_time IS NOT NULL AND s.end_time < TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata', 'HH24:MI')))
ON CONFLICT (student_id, schedule_id) DO NOTHING;

-- Trainers:
INSERT INTO trainer_attendance_records (id, schedule_id, trainer_id, trainer_name, course_id, batch_id, date, status, created_at, updated_at)
SELECT
    'tratt_' || md5(s.id || '_' || s.trainer_id),
    s.id,
    s.trainer_id,
    COALESCE(u.name, s.trainer, 'Trainer'),
    s.course_id,
    s.batch_id,
    s.date,
    'Absent',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM schedules s
JOIN courses c ON c.id = s.course_id
LEFT JOIN users u ON u.id = s.trainer_id
WHERE s.trainer_id IS NOT NULL
  AND LOWER(c.mode) IN ('online', 'hybrid')
  AND (s.date < TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')
       OR (s.date = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AND s.end_time IS NOT NULL AND s.end_time < TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata', 'HH24:MI')))
ON CONFLICT (schedule_id, trainer_id) DO NOTHING;
