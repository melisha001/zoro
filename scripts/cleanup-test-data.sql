-- scripts/cleanup-test-data.sql
-- Idempotent cleanup script for test data in Zoro Academy databases.
-- Targets test entities identified by '__TEST__' prefix or historical test identifiers.

BEGIN;

-- 1. Notifications
DELETE FROM notifications 
WHERE title LIKE '__TEST__%' 
   OR message LIKE '__TEST__%'
   OR title ILIKE '%Smoke%' 
   OR message ILIKE '%Smoke%' 
   OR message ILIKE '%Test PostgreSQL Assignment%'
   OR recipient_id IN (
       SELECT id FROM users WHERE email LIKE '__TEST__%' OR username LIKE '__TEST__%' OR email ILIKE '%smoke%' OR username ILIKE '%smoke%'
   );

-- 2. Assignment Submissions
DELETE FROM assignment_submissions
WHERE student_email LIKE '__TEST__%'
   OR student_email ILIKE '%smoke%'
   OR assignment_title LIKE '__TEST__%'
   OR assignment_title ILIKE '%Smoke Assignment%'
   OR assignment_title ILIKE '%Test PostgreSQL Assignment%'
   OR student_id IN (
       SELECT id FROM users WHERE email LIKE '__TEST__%' OR username LIKE '__TEST__%' OR email ILIKE '%smoke%' OR username ILIKE '%smoke%'
   )
   OR course_id IN (
       SELECT id FROM courses WHERE title LIKE '__TEST__%' OR title ILIKE '%Smoke%' OR title ILIKE '%Task %'
   );

-- 3. Attendance Records
DELETE FROM attendance_records
WHERE student_id IN (
       SELECT id FROM users WHERE email LIKE '__TEST__%' OR username LIKE '__TEST__%' OR email ILIKE '%smoke%' OR username ILIKE '%smoke%'
   )
   OR schedule_id IN (
       SELECT id FROM schedules WHERE title LIKE '__TEST__%' OR title ILIKE '%Smoke%'
   )
   OR course_id IN (
       SELECT id FROM courses WHERE title LIKE '__TEST__%' OR title ILIKE '%Smoke%' OR title ILIKE '%Task %'
   );

-- 4. Student Module Progress
DELETE FROM student_module_progress
WHERE student_id IN (
       SELECT id FROM users WHERE email LIKE '__TEST__%' OR username LIKE '__TEST__%' OR email ILIKE '%smoke%' OR username ILIKE '%smoke%'
   )
   OR module_id IN (
       SELECT cm.id FROM course_modules cm
       JOIN courses c ON cm.course_id = c.id
       WHERE c.title LIKE '__TEST__%' OR c.title ILIKE '%Smoke%' OR c.title ILIKE '%Task %'
   );

-- 5. Course Resources & Modules
DELETE FROM course_resources
WHERE course_id IN (
       SELECT id FROM courses WHERE title LIKE '__TEST__%' OR title ILIKE '%Smoke%' OR title ILIKE '%Task %'
   );

DELETE FROM course_modules
WHERE course_id IN (
       SELECT id FROM courses WHERE title LIKE '__TEST__%' OR title ILIKE '%Smoke%' OR title ILIKE '%Task %'
   );

-- 6. Assignments
DELETE FROM assignments
WHERE title LIKE '__TEST__%'
   OR title ILIKE '%Smoke%'
   OR title ILIKE '%Test PostgreSQL Assignment%'
   OR course_id IN (
       SELECT id FROM courses WHERE title LIKE '__TEST__%' OR title ILIKE '%Smoke%' OR title ILIKE '%Task %'
   );

-- 7. Schedules
DELETE FROM schedules
WHERE title LIKE '__TEST__%'
   OR title ILIKE '%Smoke%'
   OR course_id IN (
       SELECT id FROM courses WHERE title LIKE '__TEST__%' OR title ILIKE '%Smoke%' OR title ILIKE '%Task %'
   )
   OR batch_id IN (
       SELECT id FROM batches WHERE name LIKE '__TEST__%' OR name ILIKE '%Smoke%'
   );

-- 8. Doubts
DELETE FROM doubts
WHERE question LIKE '__TEST__%'
   OR question ILIKE '%Smoke%'
   OR course_title LIKE '__TEST__%'
   OR student_id IN (
       SELECT id FROM users WHERE email LIKE '__TEST__%' OR username LIKE '__TEST__%' OR email ILIKE '%smoke%' OR username ILIKE '%smoke%'
   )
   OR course_id IN (
       SELECT id FROM courses WHERE title LIKE '__TEST__%' OR title ILIKE '%Smoke%' OR title ILIKE '%Task %'
   );

-- 9. Enrollments & Batch Memberships
DELETE FROM enrollments
WHERE student_id IN (
       SELECT id FROM users WHERE email LIKE '__TEST__%' OR username LIKE '__TEST__%' OR email ILIKE '%smoke%' OR username ILIKE '%smoke%'
   )
   OR course_id IN (
       SELECT id FROM courses WHERE title LIKE '__TEST__%' OR title ILIKE '%Smoke%' OR title ILIKE '%Task %'
   );

DELETE FROM student_course_batches
WHERE student_id IN (
       SELECT id FROM users WHERE email LIKE '__TEST__%' OR username LIKE '__TEST__%' OR email ILIKE '%smoke%' OR username ILIKE '%smoke%'
   )
   OR course_id IN (
       SELECT id FROM courses WHERE title LIKE '__TEST__%' OR title ILIKE '%Smoke%' OR title ILIKE '%Task %'
   );

DELETE FROM trainer_course_requests
WHERE trainer_id IN (
       SELECT id FROM users WHERE email LIKE '__TEST__%' OR username LIKE '__TEST__%' OR email ILIKE '%smoke%' OR username ILIKE '%smoke%'
   )
   OR course_id IN (
       SELECT id FROM courses WHERE title LIKE '__TEST__%' OR title ILIKE '%Smoke%' OR title ILIKE '%Task %'
   );

-- 10. Batches
DELETE FROM batches
WHERE name LIKE '__TEST__%'
   OR name ILIKE '%Smoke%'
   OR course_id IN (
       SELECT id FROM courses WHERE title LIKE '__TEST__%' OR title ILIKE '%Smoke%' OR title ILIKE '%Task %'
   );

-- 11. Stored Files (Test Files)
DELETE FROM stored_files
WHERE original_name LIKE '__TEST__%'
   OR storage_path LIKE '%/test/%'
   OR original_name ILIKE '%test_banner%'
   OR original_name ILIKE 'Test_%.pdf';

-- 12. Courses
DELETE FROM courses
WHERE title LIKE '__TEST__%'
   OR title ILIKE '%Smoke%'
   OR title ILIKE '%Task C Test%'
   OR title ILIKE '%Task G %';

-- 12b. Student Fees & Refresh Tokens
DELETE FROM student_fees
WHERE student_id IN (
    SELECT id FROM users 
    WHERE (email LIKE '__TEST__%' OR username LIKE '__TEST__%' OR email ILIKE '%smoke%' OR username ILIKE '%smoke%' OR username ILIKE 'teststudent%')
      AND email NOT IN ('admin@zoro.com', 'j@gmail.com', 'd@gmail.com', 'a@gmail.com')
      AND id NOT IN ('usr-admin-1', 'std_a7e2fcb8-7e38-4d56-a24a-355eb5fa233b', 'trn_b75a017f-0844-4127-97d5-d2bf949a9110', 'trn_d84446a6-bfdc-4b36-bdd1-042fecd24d75')
);

DELETE FROM refresh_tokens
WHERE user_id IN (
    SELECT id FROM users 
    WHERE (email LIKE '__TEST__%' OR username LIKE '__TEST__%' OR email ILIKE '%smoke%' OR username ILIKE '%smoke%' OR username ILIKE 'teststudent%')
      AND email NOT IN ('admin@zoro.com', 'j@gmail.com', 'd@gmail.com', 'a@gmail.com')
      AND id NOT IN ('usr-admin-1', 'std_a7e2fcb8-7e38-4d56-a24a-355eb5fa233b', 'trn_b75a017f-0844-4127-97d5-d2bf949a9110', 'trn_d84446a6-bfdc-4b36-bdd1-042fecd24d75')
);

-- 13. Users (NEVER delete admin@zoro.com, j@gmail.com, d@gmail.com, a@gmail.com)
DELETE FROM users
WHERE (email LIKE '__TEST__%' OR username LIKE '__TEST__%' OR email ILIKE '%smoke%' OR username ILIKE '%smoke%' OR username ILIKE 'teststudent%')
  AND email NOT IN ('admin@zoro.com', 'j@gmail.com', 'd@gmail.com', 'a@gmail.com')
  AND id NOT IN ('usr-admin-1', 'std_a7e2fcb8-7e38-4d56-a24a-355eb5fa233b', 'trn_b75a017f-0844-4127-97d5-d2bf949a9110', 'trn_d84446a6-bfdc-4b36-bdd1-042fecd24d75');

COMMIT;
