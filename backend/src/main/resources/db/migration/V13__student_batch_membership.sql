-- Flyway V13: Student-Batch Membership by ID with Deduplication & Unique Constraints

-- 1. Deduplicate student_course_batches for (student_id, course_id)
DELETE FROM student_course_batches
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
            PARTITION BY student_id, course_id 
            ORDER BY created_at DESC, id DESC
        ) as rnum
        FROM student_course_batches
        WHERE student_id IS NOT NULL AND course_id IS NOT NULL
    ) t WHERE t.rnum > 1
);

-- 2. Ensure unique constraint uk_scb_student_course on student_course_batches
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_scb_student_course') THEN
        ALTER TABLE student_course_batches ADD CONSTRAINT uk_scb_student_course UNIQUE (student_id, course_id);
    END IF;
END $$;

-- 3. Deduplicate enrollments for (student_id, course_id)
DELETE FROM enrollments
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
            PARTITION BY student_id, course_id 
            ORDER BY enrolled_date DESC, id DESC
        ) as rnum
        FROM enrollments
        WHERE student_id IS NOT NULL AND course_id IS NOT NULL
    ) t WHERE t.rnum > 1
);

-- 4. Ensure unique constraint uk_enrollments_student_course on enrollments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uk_enrollments_student_course') THEN
        ALTER TABLE enrollments ADD CONSTRAINT uk_enrollments_student_course UNIQUE (student_id, course_id);
    END IF;
END $$;
