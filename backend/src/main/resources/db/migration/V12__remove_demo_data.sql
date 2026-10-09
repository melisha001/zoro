-- Flyway V12: Remove initial demo business data while preserving default admin account
DELETE FROM student_progress;
DELETE FROM assignment_submissions;
DELETE FROM student_fees;
DELETE FROM schedules;
DELETE FROM enrollments;
DELETE FROM student_course_batches;
DELETE FROM batches;
DELETE FROM course_resources;
DELETE FROM course_modules;
DELETE FROM courses;
DELETE FROM users WHERE UPPER(role) != 'ADMIN';
