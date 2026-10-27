-- V53: Add text answer support to attempt_answers and normalize hard-coded localhost URLs

ALTER TABLE attempt_answers ADD COLUMN IF NOT EXISTS text_answer text;

-- Normalize hard-coded host/port URLs in competitions banner_url
UPDATE competitions
SET banner_url = regexp_replace(banner_url, '^https?://(localhost|127\.0\.0\.1):[0-9]+', '')
WHERE banner_url ~ '^https?://(localhost|127\.0\.0\.1):[0-9]+';

-- Normalize hard-coded host/port URLs in courses thumbnail and preview_video_url
UPDATE courses
SET thumbnail = regexp_replace(thumbnail, '^https?://(localhost|127\.0\.0\.1):[0-9]+', '')
WHERE thumbnail ~ '^https?://(localhost|127\.0\.0\.1):[0-9]+';

UPDATE courses
SET preview_video_url = regexp_replace(preview_video_url, '^https?://(localhost|127\.0\.0\.1):[0-9]+', '')
WHERE preview_video_url ~ '^https?://(localhost|127\.0\.0\.1):[0-9]+';

-- Normalize hard-coded host/port URLs in users avatar
UPDATE users
SET avatar = regexp_replace(avatar, '^https?://(localhost|127\.0\.0\.1):[0-9]+', '')
WHERE avatar ~ '^https?://(localhost|127\.0\.0\.1):[0-9]+';

-- Normalize hard-coded host/port URLs in assessment_questions media_ref
UPDATE assessment_questions
SET media_ref = regexp_replace(media_ref, '^https?://(localhost|127\.0\.0\.1):[0-9]+', '')
WHERE media_ref ~ '^https?://(localhost|127\.0\.0\.1):[0-9]+';
