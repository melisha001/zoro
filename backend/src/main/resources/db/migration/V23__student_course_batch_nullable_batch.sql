-- Allow nullable batch_name in student_course_batches for recorded courses
ALTER TABLE student_course_batches ALTER COLUMN batch_name DROP NOT NULL;
