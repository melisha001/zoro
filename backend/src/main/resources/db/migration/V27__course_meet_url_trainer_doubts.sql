-- V27: Google Meet URL, Course Assigned Trainer ID, Doubt Batch ID, Attendance joined_at, and Reset Default Stock Avatar

-- T4: Google Meet URL on courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS google_meet_url TEXT;

-- T9: Assigned trainer ID on courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS assigned_trainer_id VARCHAR(64);

-- T10: Batch ID on doubts
ALTER TABLE doubts ADD COLUMN IF NOT EXISTS batch_id VARCHAR(128);

-- T5: Joined timestamp on attendance records
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP;

-- T11: Clean auto-assigned default/stock avatar URLs
UPDATE users SET avatar = NULL WHERE avatar LIKE '%photo-1539571696357%';

-- Backfill schedules.meet_link from course google_meet_url where meet_link is null or placeholder
UPDATE schedules s
SET meet_link = c.google_meet_url
FROM courses c
WHERE s.course_id = c.id
  AND c.google_meet_url IS NOT NULL
  AND (s.meet_link IS NULL OR s.meet_link ILIKE '%meet.google.com/new%' OR s.meet_link ILIKE '%meet.google.com/zoro%' OR s.meet_link ILIKE '%abc-defg-hij%');
