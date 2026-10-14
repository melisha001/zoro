ALTER TABLE schedules DROP COLUMN IF EXISTS mode;

ALTER TABLE schedules
    ADD COLUMN IF NOT EXISTS notes_file_url TEXT,
    ADD COLUMN IF NOT EXISTS notes_file_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS worksheet_file_url TEXT,
    ADD COLUMN IF NOT EXISTS worksheet_file_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS assignment_file_url TEXT,
    ADD COLUMN IF NOT EXISTS assignment_file_name VARCHAR(255);
