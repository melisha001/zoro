-- V11: Make competitions independent of courses and batches

-- Make student_id nullable in competition_registrations (outsider registration support)
ALTER TABLE competition_registrations ALTER COLUMN student_id DROP NOT NULL;

-- Add outsider metadata columns to competition_registrations if not exists
ALTER TABLE competition_registrations ADD COLUMN IF NOT EXISTS age INT;
ALTER TABLE competition_registrations ADD COLUMN IF NOT EXISTS school VARCHAR(255);
ALTER TABLE competition_registrations ADD COLUMN IF NOT EXISTS city VARCHAR(255);

-- Ensure payment_status default is 'Pending'
ALTER TABLE competition_registrations ALTER COLUMN payment_status SET DEFAULT 'Pending';
