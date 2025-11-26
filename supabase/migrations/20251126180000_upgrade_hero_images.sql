-- Upgrade hero_images table for advanced carousel features
ALTER TABLE hero_images
ADD COLUMN IF NOT EXISTS mobile_image_url TEXT,
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS schedule_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS schedule_end TIMESTAMPTZ;

-- Add comment to explain the config column
COMMENT ON COLUMN hero_images.config IS 'Stores advanced settings: typography, positioning, animations, overlays, etc.';
