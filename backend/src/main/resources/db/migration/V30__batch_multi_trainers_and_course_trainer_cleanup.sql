-- V30: Batch Multi-Trainers Join Table and Course Trainer Cleanup

-- 1. Create batch_trainers join table
CREATE TABLE IF NOT EXISTS batch_trainers (
    batch_id VARCHAR(128) NOT NULL,
    trainer_id VARCHAR(64) NOT NULL,
    assigned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_batch_trainers PRIMARY KEY (batch_id, trainer_id),
    CONSTRAINT fk_batch_trainers_batch FOREIGN KEY (batch_id) REFERENCES batches (id) ON DELETE CASCADE
);

-- 2. Backfill batch_trainers from existing batches.trainer_id
INSERT INTO batch_trainers (batch_id, trainer_id, assigned_at)
SELECT b.id, b.trainer_id, COALESCE(b.created_at, CURRENT_TIMESTAMP)
FROM batches b
WHERE b.trainer_id IS NOT NULL AND b.trainer_id <> ''
ON CONFLICT (batch_id, trainer_id) DO NOTHING;

-- 3. Course trainer clean-up: Online and Hybrid courses do NOT have a course-level trainer
UPDATE courses
SET trainer_id = NULL, assigned_trainer = NULL
WHERE mode IN ('Online', 'Hybrid');
