-- V44__trainer_salary_and_notification_cleanup.sql
-- Add payment_method and transaction_id to salary_records, cascade on delete trainer, and notification indexes

ALTER TABLE salary_records ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE salary_records ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_salary_records_trainer'
    ) THEN
        ALTER TABLE salary_records
        ADD CONSTRAINT fk_salary_records_trainer
        FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role ON notifications(recipient_role);
CREATE INDEX IF NOT EXISTS idx_salary_records_trainer_id ON salary_records(trainer_id);
