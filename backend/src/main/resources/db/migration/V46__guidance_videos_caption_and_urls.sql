-- V46: Add caption and streaming URLs to competition_guidance_videos, de-duplicate and enforce uniqueness

-- 1. Add caption, embed_url, and playback_url columns if they do not exist
ALTER TABLE competition_guidance_videos 
    ADD COLUMN IF NOT EXISTS caption VARCHAR(500),
    ADD COLUMN IF NOT EXISTS embed_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS playback_url VARCHAR(500);

-- 2. Backfill caption from title where caption is null
UPDATE competition_guidance_videos 
SET caption = title 
WHERE caption IS NULL OR caption = '';

-- 3. De-duplicate any existing duplicates based on (competition_id, bunny_video_id) keeping the earliest
DELETE FROM competition_guidance_videos a USING competition_guidance_videos b
WHERE a.competition_id = b.competition_id 
  AND a.bunny_video_id = b.bunny_video_id 
  AND a.created_at > b.created_at;

-- 4. Create unique constraint to prevent duplicate video entries per competition
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_comp_guidance_video_bunny'
    ) THEN
        ALTER TABLE competition_guidance_videos 
        ADD CONSTRAINT uq_comp_guidance_video_bunny UNIQUE (competition_id, bunny_video_id);
    END IF;
END $$;
