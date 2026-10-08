-- Zoro Academy: Clean all demo/seed business records so PostgreSQL starts clean
-- Only the administrator account is preserved for system administration and authentication

DELETE FROM fee_payments;
DELETE FROM student_fees;
DELETE FROM student_course_batches;
DELETE FROM enrollments;
DELETE FROM enrollment_requests;
DELETE FROM attendance_records;
DELETE FROM schedules;
DELETE FROM assignment_submissions;
DELETE FROM assignments;
DELETE FROM student_progress;
DELETE FROM doubts;
DELETE FROM competition_registrations;
DELETE FROM competition_modules;
DELETE FROM competitions;
DELETE FROM batches;
DELETE FROM course_resources;
DELETE FROM course_modules;
DELETE FROM courses;
DELETE FROM expenses;
DELETE FROM salary_records;
DELETE FROM enquiries;
DELETE FROM notifications;
DELETE FROM activity_logs;

-- Keep only admin user account
DELETE FROM users WHERE role != 'ADMIN';

-- Ensure admin account exists with standard password
INSERT INTO users (id, email, username, password, name, role, phone, status, address, joined_on, specialty, code, salary_amount, salary_credit_date)
VALUES ('usr-admin-1', 'admin@zoro.com', 'admin', '$2a$10$Dow1qZ9ZomQWq/a91OaJ5.L3sBqJmJgS9P2tF0eF4Nqj18mF9yGla', 'System Administrator', 'ADMIN', '+91 98765 00000', 'Active', 'Chennai, India', '2024-01-01', 'Academy Director', 'ZA-AD-001', 0, '1')
ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password, role = 'ADMIN', status = 'Active';
