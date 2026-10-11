-- V18: Drop registration_form_url from competitions
ALTER TABLE competitions DROP COLUMN IF EXISTS registration_form_url;
