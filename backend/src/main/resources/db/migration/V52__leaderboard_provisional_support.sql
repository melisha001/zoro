-- V52: Support provisional rankings on leaderboard for candidates pending evaluation
ALTER TABLE competition_leaderboard_cache ADD COLUMN IF NOT EXISTS is_provisional BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE leaderboard_entries ADD COLUMN IF NOT EXISTS is_provisional BOOLEAN NOT NULL DEFAULT FALSE;
