-- V40: Attendance correction window, trainer status modification audit, and history tracking

-- 1. Add audit columns to attendance_records
ALTER TABLE attendance_records
    ADD COLUMN IF NOT EXISTS original_status VARCHAR(50),
    ADD COLUMN IF NOT EXISTS status_changed_by VARCHAR(128),
    ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMP;

-- 2. Create attendance_changes audit table
CREATE TABLE IF NOT EXISTS attendance_changes (
    id VARCHAR(128) PRIMARY KEY,
    attendance_id VARCHAR(128) REFERENCES attendance_records(id) ON DELETE CASCADE,
    schedule_id VARCHAR(128),
    student_id VARCHAR(64),
    original_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(128) NOT NULL,
    changed_at TIMESTAMP NOT NULL,
    remark TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_att_changes_att_id ON attendance_changes(attendance_id);
CREATE INDEX IF NOT EXISTS idx_att_changes_schedule_id ON attendance_changes(schedule_id);
CREATE INDEX IF NOT EXISTS idx_att_changes_student_id ON attendance_changes(student_id);
