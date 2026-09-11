-- Direct-owner filtering for Facebook group scraping
-- Run this once in the Supabase SQL editor.

ALTER TABLE group_configs
  ADD COLUMN IF NOT EXISTS owner_only BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS exclude_agents BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS minimum_intent_score INTEGER NOT NULL DEFAULT 7
    CHECK (minimum_intent_score BETWEEN 0 AND 10);

-- Existing monitored groups should keep both owner listings and looking-for clients.
UPDATE group_configs
SET owner_only = FALSE,
    exclude_agents = TRUE,
    minimum_intent_score = 7;

COMMENT ON COLUMN group_configs.owner_only IS 'Keep only posts classified as property-owner listings';
COMMENT ON COLUMN group_configs.exclude_agents IS 'Reject posts identified as agents or agencies';
COMMENT ON COLUMN group_configs.minimum_intent_score IS 'Minimum direct-owner confidence score; 0 disables this threshold';