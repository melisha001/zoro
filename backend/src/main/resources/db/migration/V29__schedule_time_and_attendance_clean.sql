-- V29: Schedule Time Model (start_time, end_time, start_at, end_at, audience) and Attendance Course Normalization

-- 1. Add columns to schedules
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS start_time VARCHAR(10);
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS end_time VARCHAR(10);
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS start_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS end_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS audience VARCHAR(20) DEFAULT 'STUDENT';

-- 2. Backfill start_time, end_time, start_at, end_at from existing time and date
UPDATE schedules
SET
  start_time = TO_CHAR(TO_TIMESTAMP(TRIM(SPLIT_PART(time, '-', 1)), 'HH12:MI AM'), 'HH24:MI'),
  end_time = TO_CHAR(TO_TIMESTAMP(TRIM(SPLIT_PART(time, '-', 2)), 'HH12:MI AM'), 'HH24:MI'),
  start_at = TO_TIMESTAMP(date || ' ' || TRIM(SPLIT_PART(time, '-', 1)), 'YYYY-MM-DD HH12:MI AM'),
  end_at = TO_TIMESTAMP(date || ' ' || TRIM(SPLIT_PART(time, '-', 2)), 'YYYY-MM-DD HH12:MI AM'),
  audience = COALESCE(audience, 'STUDENT')
WHERE time LIKE '%-%';

-- 3. Normalize legacy attendance course_id values matching course titles to real course IDs
UPDATE attendance_records a
SET course_id = c.id
FROM courses c
WHERE LOWER(a.course_id) = LOWER(c.title);

-- 4. Deduplicate attendance_records keeping PRESENT if duplicate exists
DELETE FROM attendance_records a
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY schedule_id, student_id 
             ORDER BY CASE WHEN UPPER(status) = 'PRESENT' THEN 1 ELSE 2 END, created_at DESC
           ) as rn
    FROM attendance_records
    WHERE schedule_id IS NOT NULL AND student_id IS NOT NULL
  ) t WHERE t.rn > 1
);

-- 5. Ensure uk_attendance_student_schedule constraint exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_attendance_student_schedule') THEN
    ALTER TABLE attendance_records ADD CONSTRAINT uk_attendance_student_schedule UNIQUE (student_id, schedule_id);
  END IF;
END $$;
