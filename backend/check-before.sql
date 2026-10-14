SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'batch_trainers') AS batch_trainers_exists;
SELECT id, title, mode, trainer_id, assigned_trainer FROM courses WHERE mode IN ('Online', 'Hybrid');
SELECT id, name, trainer_id, trainer_name FROM batches;
