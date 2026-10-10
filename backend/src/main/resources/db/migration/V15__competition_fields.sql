-- V15: Add comprehensive persistence fields to competitions
ALTER TABLE competitions
    ADD COLUMN IF NOT EXISTS reg_start_date VARCHAR(50),
    ADD COLUMN IF NOT EXISTS reg_end_date VARCHAR(50),
    ADD COLUMN IF NOT EXISTS start_time VARCHAR(20),
    ADD COLUMN IF NOT EXISTS end_time VARCHAR(20),
    ADD COLUMN IF NOT EXISTS venue VARCHAR(255),
    ADD COLUMN IF NOT EXISTS banner_url TEXT,
    ADD COLUMN IF NOT EXISTS rules_pdf_url TEXT,
    ADD COLUMN IF NOT EXISTS registration_form_url TEXT,
    ADD COLUMN IF NOT EXISTS instructions TEXT,
    ADD COLUMN IF NOT EXISTS contact_details TEXT;
