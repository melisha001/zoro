-- V36__hero_images.sql
-- Table for admin-managed landing page hero background images

CREATE TABLE IF NOT EXISTS hero_images (
    id VARCHAR(128) PRIMARY KEY,
    url TEXT NOT NULL,
    storage_key VARCHAR(255),
    sort_order INT DEFAULT 0,
    alt_text VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hero_images_sort_active ON hero_images(active, sort_order);
