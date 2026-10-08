-- Zoro English Academy PostgreSQL Initial Seed Data V2

-- Users: Passwords are "password123" encrypted with BCrypt ($2a$10$N.Zvh7Ie8B8jO/x7X18Q8u0lJdJgA5z0W7tF2kK1h0uT8G9p9aUqa)
-- Admin: admin@zoro.com / password123
INSERT INTO users (id, email, username, password, name, role, phone, status, address, joined_on, specialty, code, salary_amount, salary_credit_date, course)
VALUES 
('usr-admin-1', 'admin@zoro.com', 'admin', '$2a$10$N.Zvh7Ie8B8jO/x7X18Q8u0lJdJgA5z0W7tF2kK1h0uT8G9p9aUqa', 'Admin Zoro', 'ADMIN', '+91 98765 00000', 'Active', 'Chennai, India', '2024-01-01', 'Academy Director', 'ZA-AD-001', 0, '1', NULL),
('trn-1', 'priya@trainer.com', 'priya', '$2a$10$N.Zvh7Ie8B8jO/x7X18Q8u0lJdJgA5z0W7tF2kK1h0uT8G9p9aUqa', 'Priya', 'TRAINER', '+91 98765 11111', 'Active', 'Chennai, India', '2025-01-10', 'English Communication & Abacus', 'ZA-TR-001', 35000, '25', NULL),
('trn-2', 'rahul@trainer.com', 'rahul', '$2a$10$N.Zvh7Ie8B8jO/x7X18Q8u0lJdJgA5z0W7tF2kK1h0uT8G9p9aUqa', 'Rahul', 'TRAINER', '+91 98765 22222', 'Active', 'Chennai, India', '2025-03-15', 'Chess Mastery', 'ZA-TR-002', 28000, '20', NULL),
('std-1', 'arjun@student.com', 'arjun123', '$2a$10$N.Zvh7Ie8B8jO/x7X18Q8u0lJdJgA5z0W7tF2kK1h0uT8G9p9aUqa', 'Arjun M', 'STUDENT', '+91 98765 43210', 'Active', 'Chennai, India', '12 Jan 2026', NULL, NULL, 0, NULL, 'English Communication'),
('std-2', 'ananya@student.com', 'ananya123', '$2a$10$N.Zvh7Ie8B8jO/x7X18Q8u0lJdJgA5z0W7tF2kK1h0uT8G9p9aUqa', 'Ananya R', 'STUDENT', '+91 98765 43211', 'Active', 'Chennai, India', '01 Feb 2026', NULL, NULL, 0, NULL, 'Abacus Level 3')
ON CONFLICT (id) DO NOTHING;

-- Courses
INSERT INTO courses (id, title, description, category, mode, level, audience, duration, price, original_price, thumbnail, preview_video_url, enrolled, rating, status, assigned_trainer)
VALUES 
('grammar-phonics-spoken', 'Grammar + Phonics + Spoken English', 'Complete bundle for mastering everyday spoken English, phonics pronunciation and clear grammar structure.', 'Spoken English', 'Online', 'Beginner to Intermediate', 'student', '12 Weeks', 4999.00, 6999.00, 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 120, 4.9, 'Active', 'Ms. Priya'),
('phonics-l1-l2', 'Phonics Level 1 & Level 2', 'Foundation phonics course for early learners, accent neutralization and reading confidence.', 'Phonics', 'Recorded', 'Beginner', 'student', '8 Weeks', 2999.00, 4499.00, 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 85, 4.8, 'Active', 'Ms. Priya'),
('english-comm', 'English Communication Mastery', 'Comprehensive English spoken skills, corporate communication, public speaking and grammar.', 'Communication', 'Hybrid', 'All Levels', 'student', '16 Weeks', 5999.00, 7999.00, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 150, 4.9, 'Active', 'Ms. Priya'),
('abacus-l3', 'Abacus Level 3', 'Advanced mental math calculations and speed calculation training.', 'Mental Math', 'Online', 'Intermediate', 'student', '10 Weeks', 3499.00, 4999.00, 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=600', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 60, 4.7, 'Active', 'Mr. Rahul'),
('chess-mastery', 'Chess Mastery', 'Tactics, opening principles, endgame fundamentals and tournament preparation.', 'Strategic Games', 'Online', 'All Levels', 'student', '12 Weeks', 3999.00, 5499.00, 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=600', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 45, 4.8, 'Active', 'Mr. Rahul')
ON CONFLICT (id) DO NOTHING;

-- Course Modules
INSERT INTO course_modules (id, course_id, module_order, title, description, duration, video_storage_ref, after_session_assessment)
VALUES
('mod-1', 'grammar-phonics-spoken', 1, 'Module 1: Everyday Greetings & Introductions', 'Introduction to active conversation, phonetics of vowel sounds, and basic tense rules.', '45 mins', '{"storageKey": "vid_greetings_01", "directStreamUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "status": "Ready"}', '{"title": "Greetings Assessment", "description": "Record a 60 second voice introduction and answer the short quiz."}'),
('mod-2', 'grammar-phonics-spoken', 2, 'Module 2: Sentence Formation & Action Verbs', 'Constructing sentences with regular and irregular verbs and active voice usage.', '50 mins', '{"storageKey": "vid_sentences_02", "directStreamUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "status": "Ready"}', '{"title": "Sentence Drill Worksheet", "description": "Submit complete answers to the 20 sentence formation questions."}'),
('mod-3', 'phonics-l1-l2', 1, 'Phonics 1: Single Letter Sounds', 'A to Z phoneme pronunciation and blending basic CVC words.', '40 mins', '{"storageKey": "vid_phonics_cvc", "directStreamUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "status": "Ready"}', '{"title": "Phonics Sound Quiz", "description": "Identify beginning sounds and blend 10 words."}'),
('mod-4', 'phonics-l1-l2', 2, 'Phonics 2: Digraphs and Blends', 'Consonant blends, digraphs ch/sh/th/wh and reading sentences.', '45 mins', '{"storageKey": "vid_phonics_digraphs", "directStreamUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "status": "Ready"}', '{"title": "Digraph Reading Assessment", "description": "Read aloud passage and submit audio recording."}'),
('mod-5', 'english-comm', 1, 'Session 1: Fluency Foundations', 'Confidence building, pacing, voice inflection and overcoming hesitation.', '60 mins', '{"storageKey": "vid_fluency_01", "directStreamUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "status": "Ready"}', '{"title": "Self Introduction Video Submission", "description": "Record 2 minutes speech on your goals."}'),
('mod-6', 'english-comm', 2, 'Session 2: Storytelling & Expressive Speech', 'Engaging listeners, descriptive vocabulary and tone modulation.', '55 mins', '{"storageKey": "vid_story_02", "directStreamUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "status": "Ready"}', '{"title": "Story Narration Task", "description": "Narrate an interesting memory in 3 minutes."}')
ON CONFLICT (id) DO NOTHING;

-- Course Resources
INSERT INTO course_resources (id, course_id, module_id, title, file_url, file_type, file_size, target_audience)
VALUES
('res-1', 'grammar-phonics-spoken', 'mod-1', 'Module 1 - Greetings & Pronunciation Guide.pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'pdf', '1.2 MB', 'student'),
('res-2', 'grammar-phonics-spoken', 'mod-2', 'Module 2 - Sentence Transformation Cheatsheet.pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'pdf', '850 KB', 'student'),
('res-3', 'phonics-l1-l2', 'mod-3', 'Phonics Sound Chart Level 1.pdf', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'pdf', '2.1 MB', 'student')
ON CONFLICT (id) DO NOTHING;

-- Batches
INSERT INTO batches (id, name, course_name, course_id, trainer_name, trainer_id, days, session, status)
VALUES
('btc-1', 'Batch A', 'Grammar + Phonics + Spoken English', 'grammar-phonics-spoken', 'Priya', 'trn-1', 'Monday, Wednesday, Friday', 'Morning', 'Active'),
('btc-2', 'Batch B', 'Grammar + Phonics + Spoken English', 'grammar-phonics-spoken', 'Priya', 'trn-1', 'Tuesday, Thursday', 'Evening', 'Active'),
('btc-3', 'Batch C', 'Abacus Level 3', 'abacus-l3', 'Rahul', 'trn-2', 'Friday, Saturday', 'Morning', 'Active'),
('btc-4', 'Batch D', 'Chess Mastery', 'chess-mastery', 'Rahul', 'trn-2', 'Saturday, Sunday', 'Evening', 'Inactive')
ON CONFLICT (id) DO NOTHING;

-- Student Course Batches
INSERT INTO student_course_batches (student_id, course_name, batch_name, batch_id)
VALUES
('std-1', 'Grammar + Phonics + Spoken English', 'Batch A', 'btc-1'),
('std-2', 'Abacus Level 3', 'Batch C', 'btc-3');

-- Enrollments
INSERT INTO enrollments (id, student_id, student_email, course_id, course_title, batch_name, enrolled_date, status)
VALUES
('enr-1', 'std-1', 'arjun@student.com', 'grammar-phonics-spoken', 'Grammar + Phonics + Spoken English', 'Batch A', '2026-09-01', 'Active'),
('enr-2', 'std-2', 'ananya@student.com', 'phonics-l1-l2', 'Phonics Level 1 & Level 2', 'Batch B', '2026-09-05', 'Active'),
('enr-3', 'arjun@student.com', 'arjun@student.com', 'phonics-l1-l2', 'Phonics Level 1 & Level 2', 'Batch A', '2026-09-05', 'Active')
ON CONFLICT (id) DO NOTHING;

-- Schedules
INSERT INTO schedules (id, title, course, course_id, batch, batch_id, trainer, trainer_id, time, date, mode, students_count, status)
VALUES
('sch-1', 'Level 2 - Present Tense', 'Grammar + Phonics + Spoken English', 'grammar-phonics-spoken', 'Batch A', 'btc-1', 'Priya', 'trn-1', '05:00 PM - 06:00 PM', '2026-10-10', 'Online (Google Meet)', 28, 'Upcoming'),
('sch-2', 'Level 1 - Daily Conversation', 'Grammar + Phonics + Spoken English', 'grammar-phonics-spoken', 'Batch A', 'btc-1', 'Priya', 'trn-1', '06:00 PM - 07:00 PM', '2026-10-10', 'Online (Google Meet)', 25, 'Upcoming'),
('sch-3', 'Vocabulary Building & Phonics', 'Grammar + Phonics + Spoken English', 'grammar-phonics-spoken', 'Batch B', 'btc-2', 'Rahul', 'trn-2', '07:00 PM - 08:00 PM', '2026-10-09', 'Online (Google Meet)', 28, 'Completed'),
('sch-4', 'Abacus Speed Calculation', 'Abacus Level 3', 'abacus-l3', 'Batch C', 'btc-3', 'Rahul', 'trn-2', '04:00 PM - 05:00 PM', '2026-10-09', 'Offline (Branch A)', 20, 'Completed')
ON CONFLICT (id) DO NOTHING;

-- Student Fees
INSERT INTO student_fees (id, student_id, student_name, course, batch, total_fee, paid_amount, due_amount, status, date)
VALUES
('fee-1', 'std-1', 'Arjun M', 'Grammar + Phonics + Spoken English', 'Batch A', 15000, 15000, 0, 'Paid', '2026-09-10'),
('fee-2', 'std-2', 'Ananya R', 'Abacus Level 3', 'Batch C', 12000, 12000, 0, 'Paid', '2026-09-08'),
('fee-3', 'std-3', 'Tharun K', 'Grammar + Phonics + Spoken English', 'Batch A', 15000, 10000, 5000, 'Pending', '2026-09-05'),
('fee-4', 'std-4', 'Divya S', 'Grammar + Phonics + Spoken English', 'Batch B', 15000, 5000, 10000, 'Overdue', '2026-08-15')
ON CONFLICT (id) DO NOTHING;

-- Submissions
INSERT INTO assignment_submissions (id, mode, course_title, course_id, batch_name, student_name, student_email, assignment_title, source_type, source_id, submitted_at, answer_text, attachment, status, assigned_trainer, corrected_by, corrected_at, remarks, score)
VALUES
('sub-1', 'Online', 'Grammar + Phonics + Spoken English', 'grammar-phonics-spoken', 'Batch A', 'Arjun M', 'arjun@student.com', 'Live Session 2 Speech Draft', 'schedule', 'sch-1', '25/09/2026 10:30 AM', 'My 2-minute speech transcript on environmental conservation attached.', '{"name": "Arjun_Speech_Draft.pdf", "fileUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", "type": "pdf", "size": "1.2 MB"}', 'Pending Correction', 'Ms. Priya', NULL, NULL, '', ''),
('sub-2', 'Online', 'Grammar + Phonics + Spoken English', 'grammar-phonics-spoken', 'Batch A', 'Arjun M', 'arjun@student.com', 'Worksheet 1: Tenses', 'schedule', 'sch-2', '22/09/2026 03:30 PM', 'Completed all 25 sentence transformation exercises.', '{"name": "Arjun_Worksheet1_Tenses.pdf", "fileUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", "type": "pdf", "size": "1.4 MB"}', 'Corrected', 'Ms. Priya', 'Ms. Priya', '23/09/2026 11:00 AM', 'Fantastic attempt! Perfect usage of past continuous.', '98/100')
ON CONFLICT (id) DO NOTHING;

-- Student Progress
INSERT INTO student_progress (student_id, course_id, module_id, last_position, completion_percentage, status, last_accessed_time)
VALUES
('arjun@student.com', 'grammar-phonics-spoken', 'mod-1', 45, 100, 'Completed', CURRENT_TIMESTAMP),
('arjun@student.com', 'grammar-phonics-spoken', 'mod-2', 120, 50, 'In Progress', CURRENT_TIMESTAMP)
ON CONFLICT (student_id, course_id, module_id) DO NOTHING;

-- Website Settings
INSERT INTO website_settings (id, hero_headline, hero_subheadline, contact_email, contact_phone, address, banner_announcement, settings_json)
VALUES
('default', 'Unlock English Fluency with Zoro Academy', 'Empowering learners of all ages through phonics, grammar, abacus and confident communication.', 'contact@zoroacademy.com', '+91 98765 43210', 'Chennai, Tamil Nadu, India', '🎉 Admissions open for new batches! Enroll now for early bird discount.', '{"academyName": "Zoro English Academy", "supportHours": "9:00 AM - 7:00 PM IST"}')
ON CONFLICT (id) DO NOTHING;
