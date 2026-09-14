-- Facebook Marketplace search configs for the apify/facebook-marketplace-scraper actor.
-- Mirrors group_configs (same filter policy columns) so the webhook can reuse
-- the same shouldStoreLead() filtering logic.
-- Run this once in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS marketplace_search_configs (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                  TEXT NOT NULL,
  url                   TEXT NOT NULL UNIQUE,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  owner_only            BOOLEAN NOT NULL DEFAULT false,
  exclude_agents        BOOLEAN NOT NULL DEFAULT true,
  minimum_intent_score  INTEGER NOT NULL DEFAULT 7 CHECK (minimum_intent_score BETWEEN 0 AND 10),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_search_configs_active ON marketplace_search_configs(is_active);

CREATE OR REPLACE FUNCTION update_marketplace_search_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marketplace_search_configs_updated_at ON marketplace_search_configs;
CREATE TRIGGER trigger_marketplace_search_configs_updated_at
  BEFORE UPDATE ON marketplace_search_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_search_configs_updated_at();

COMMENT ON TABLE marketplace_search_configs IS 'Facebook Marketplace search/category URLs monitored for lead scraping';
COMMENT ON COLUMN marketplace_search_configs.url IS 'Full Facebook Marketplace URL (location, category, or search query form)';
COMMENT ON COLUMN marketplace_search_configs.owner_only IS 'Keep only property-owner listings';
COMMENT ON COLUMN marketplace_search_configs.exclude_agents IS 'Reject agents and agencies';
COMMENT ON COLUMN marketplace_search_configs.minimum_intent_score IS 'Minimum direct-owner confidence score';

ALTER TABLE marketplace_search_configs ENABLE ROW LEVEL SECURITY;

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'marketplace_search_configs'
      AND policyname = 'Service role has full access to marketplace_search_configs'
  ) THEN
    CREATE POLICY "Service role has full access to marketplace_search_configs"
      ON marketplace_search_configs FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'marketplace_search_configs'
      AND policyname = 'Authenticated users can read marketplace_search_configs'
  ) THEN
    CREATE POLICY "Authenticated users can read marketplace_search_configs"
      ON marketplace_search_configs FOR SELECT TO authenticated
      USING (true);
  END IF;
END $do$;

-- Seed a starting Malta property-rentals search. Update the location/category
-- via the dashboard's Marketplace panel or by editing the URL directly.
INSERT INTO marketplace_search_configs (name, url, is_active)
VALUES ('Malta Property Rentals', 'https://www.facebook.com/marketplace/malta/propertyrentals', true)
ON CONFLICT (url) DO NOTHING;
