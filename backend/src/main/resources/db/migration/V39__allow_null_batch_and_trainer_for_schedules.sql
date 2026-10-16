-- V39__allow_null_batch_and_trainer_for_schedules.sql
-- Allow NULL for batch and trainer columns on schedules table for trainer-audience courses

ALTER TABLE schedules ALTER COLUMN batch DROP NOT NULL;
ALTER TABLE schedules ALTER COLUMN trainer DROP NOT NULL;
