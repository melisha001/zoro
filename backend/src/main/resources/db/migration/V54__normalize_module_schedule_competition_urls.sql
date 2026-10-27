-- V54: Normalize legacy hard-coded localhost URLs in course_modules, schedules, and competitions to relative /api/files/ paths
UPDATE course_modules
SET notes_file_url = regexp_replace(notes_file_url, '^https?://(localhost|127\.0\.0\.1):[0-9]+', '')
WHERE notes_file_url ~ '^https?://(localhost|127\.0\.0\.1):[0-9]+';

UPDATE course_modules
SET worksheet_file_url = regexp_replace(worksheet_file_url, '^https?://(localhost|127\.0\.0\.1):[0-9]+', '')
WHERE worksheet_file_url ~ '^https?://(localhost|127\.0\.0\.1):[0-9]+';

UPDATE course_modules
SET assignment_file_url = regexp_replace(assignment_file_url, '^https?://(localhost|127\.0\.0\.1):[0-9]+', '')
WHERE assignment_file_url ~ '^https?://(localhost|127\.0\.0\.1):[0-9]+';

UPDATE schedules
SET notes_file_url = regexp_replace(notes_file_url, '^https?://(localhost|127\.0\.0\.1):[0-9]+', '')
WHERE notes_file_url ~ '^https?://(localhost|127\.0\.0\.1):[0-9]+';

UPDATE schedules
SET worksheet_file_url = regexp_replace(worksheet_file_url, '^https?://(localhost|127\.0\.0\.1):[0-9]+', '')
WHERE worksheet_file_url ~ '^https?://(localhost|127\.0\.0\.1):[0-9]+';

UPDATE schedules
SET assignment_file_url = regexp_replace(assignment_file_url, '^https?://(localhost|127\.0\.0\.1):[0-9]+', '')
WHERE assignment_file_url ~ '^https?://(localhost|127\.0\.0\.1):[0-9]+';

UPDATE competitions
SET rules_pdf_url = regexp_replace(rules_pdf_url, '^https?://(localhost|127\.0\.0\.1):[0-9]+', '')
WHERE rules_pdf_url ~ '^https?://(localhost|127\.0\.0\.1):[0-9]+';
