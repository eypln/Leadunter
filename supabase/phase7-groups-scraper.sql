-- Phase 7: Facebook Groups Scraper - Database Migration
-- Run this in Supabase SQL Editor: https://app.supabase.com

-- =============================================
-- 1. Add scrape_source column to leads table
-- =============================================
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS scrape_source TEXT DEFAULT 'UNKNOWN';

-- Add index for source-based filtering
CREATE INDEX IF NOT EXISTS idx_leads_scrape_source ON leads(scrape_source);

-- Add comment for clarity
COMMENT ON COLUMN leads.scrape_source IS 'Source of the lead: FACEBOOK_MARKETPLACE, FACEBOOK_GROUP:GroupName, or UNKNOWN';

-- =============================================
-- 2. Create group_configs table
-- =============================================
CREATE TABLE IF NOT EXISTS group_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  owner_only BOOLEAN NOT NULL DEFAULT false,
  exclude_agents BOOLEAN NOT NULL DEFAULT true,
  minimum_intent_score INTEGER NOT NULL DEFAULT 7 CHECK (minimum_intent_score BETWEEN 0 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active group lookups
CREATE INDEX IF NOT EXISTS idx_group_configs_active ON group_configs(is_active);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_group_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_group_configs_updated_at ON group_configs;
CREATE TRIGGER trigger_group_configs_updated_at
  BEFORE UPDATE ON group_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_group_configs_updated_at();

-- Comments
COMMENT ON TABLE group_configs IS 'Configuration for Facebook Groups to scrape for leads';
COMMENT ON COLUMN group_configs.name IS 'Display name for the Facebook Group';
COMMENT ON COLUMN group_configs.url IS 'Full Facebook Group URL to scrape';
COMMENT ON COLUMN group_configs.is_active IS 'Whether this group is currently being scraped';
COMMENT ON COLUMN group_configs.owner_only IS 'Keep only property-owner listings';
COMMENT ON COLUMN group_configs.exclude_agents IS 'Reject agents and agencies';
COMMENT ON COLUMN group_configs.minimum_intent_score IS 'Minimum direct-owner confidence score';

-- =============================================
-- 3. Enable Row Level Security
-- =============================================
ALTER TABLE group_configs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Service role has full access to group_configs" ON group_configs;
CREATE POLICY "Service role has full access to group_configs"
  ON group_configs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read
DROP POLICY IF EXISTS "Authenticated users can read group_configs" ON group_configs;
CREATE POLICY "Authenticated users can read group_configs"
  ON group_configs
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- 4. Seed Malta real estate Facebook groups
-- =============================================
-- NOTE: These are example URLs. Update with real Malta Facebook Group URLs.
INSERT INTO group_configs (name, url, is_active) 
VALUES
  ('Malta Property Group 1', 'https://www.facebook.com/share/g/1DkanJFSpM/', true),
  ('Malta Property Group 2', 'https://www.facebook.com/share/g/1GqUW2Tojk/', true),
  ('Malta Property Group 3', 'https://www.facebook.com/share/g/14aPUrKb2Kq/', true),
  ('Malta Property Group 4', 'https://www.facebook.com/share/g/1EEAoK5eTx/', true),
  ('Malta Property Group 5', 'https://www.facebook.com/share/g/14bjR19Sbeg', true)
ON CONFLICT (url) DO NOTHING;

-- =============================================
-- 5. Update existing test data with source
-- =============================================
UPDATE leads 
SET scrape_source = 'FACEBOOK_GROUP:Malta Property Rentals'
WHERE id IN (
  SELECT id FROM leads
  WHERE scrape_source = 'UNKNOWN' OR scrape_source IS NULL
  LIMIT 3
);

-- Verify the migration
SELECT 
  'leads.scrape_source column added' AS check_name,
  COUNT(*) AS total_leads,
  COUNT(scrape_source) AS leads_with_source
FROM leads

UNION ALL

SELECT 
  'group_configs table created' AS check_name,
  COUNT(*) AS total_groups,
  COUNT(CASE WHEN is_active THEN 1 END) AS active_groups
FROM group_configs;
