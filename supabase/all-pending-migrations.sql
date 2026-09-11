-- ================================================================
-- Lead Hunter — Combined Pending Migrations
-- Run this ONCE in Supabase Dashboard > SQL Editor
-- https://app.supabase.com/project/pdfnojbaivqxstqakfpc/sql/new
-- ================================================================

-- ── 1. Add price field to leads ──────────────────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS price INTEGER;

COMMENT ON COLUMN leads.price IS 'Monthly rent price in EUR. For OWNER: asking price. For CLIENT: max budget.';

CREATE INDEX IF NOT EXISTS idx_leads_price ON leads(price) WHERE price IS NOT NULL;


-- ── 2. Add Apify tracking fields to scraping_jobs ────────────────
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS run_id TEXT;
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS dataset_id TEXT;

CREATE INDEX IF NOT EXISTS idx_scraping_jobs_run_id ON scraping_jobs(run_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_dataset_id ON scraping_jobs(dataset_id);

COMMENT ON COLUMN scraping_jobs.run_id IS 'Apify Actor run ID';
COMMENT ON COLUMN scraping_jobs.dataset_id IS 'Apify dataset ID containing scraped data';


-- ── 3. Add scrape_source to leads (Phase 7) ──────────────────────
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scrape_source TEXT DEFAULT 'UNKNOWN';

CREATE INDEX IF NOT EXISTS idx_leads_scrape_source ON leads(scrape_source);

COMMENT ON COLUMN leads.scrape_source IS 'Source: FACEBOOK_MARKETPLACE, FACEBOOK_GROUP:GroupName, or UNKNOWN';


-- ── 4. Create group_configs table (Phase 7) ──────────────────────
CREATE TABLE IF NOT EXISTS group_configs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  url        TEXT NOT NULL UNIQUE,
  is_active  BOOLEAN DEFAULT true,
  owner_only BOOLEAN NOT NULL DEFAULT false,
  exclude_agents BOOLEAN NOT NULL DEFAULT true,
  minimum_intent_score INTEGER NOT NULL DEFAULT 7 CHECK (minimum_intent_score BETWEEN 0 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_configs_active ON group_configs(is_active);

COMMENT ON TABLE  group_configs IS 'Facebook Groups monitored for lead scraping';
COMMENT ON COLUMN group_configs.url IS 'Full Facebook Group URL';
COMMENT ON COLUMN group_configs.is_active IS 'Whether this group is currently being scraped';
COMMENT ON COLUMN group_configs.owner_only IS 'Keep only property-owner listings';
COMMENT ON COLUMN group_configs.exclude_agents IS 'Reject agents and agencies';
COMMENT ON COLUMN group_configs.minimum_intent_score IS 'Minimum direct-owner confidence score';

-- Auto-update updated_at
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

-- RLS
ALTER TABLE group_configs ENABLE ROW LEVEL SECURITY;

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'group_configs'
      AND policyname = 'Service role has full access to group_configs'
  ) THEN
    CREATE POLICY "Service role has full access to group_configs"
      ON group_configs FOR ALL TO service_role
      USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'group_configs'
      AND policyname = 'Authenticated users can read group_configs'
  ) THEN
    CREATE POLICY "Authenticated users can read group_configs"
      ON group_configs FOR SELECT TO authenticated
      USING (true);
  END IF;
END $do$;

-- Seed Malta Facebook groups
INSERT INTO group_configs (name, url, is_active) VALUES
  ('Malta Property Group 1', 'https://www.facebook.com/share/g/1DkanJFSpM/', true),
  ('Malta Property Group 2', 'https://www.facebook.com/share/g/1GqUW2Tojk/', true),
  ('Malta Property Group 3', 'https://www.facebook.com/share/g/14aPUrKb2Kq/', true),
  ('Malta Property Group 4', 'https://www.facebook.com/share/g/1EEAoK5eTx/', true),
  ('Malta Property Group 5', 'https://www.facebook.com/share/g/14bjR19Sbeg', true)
ON CONFLICT (url) DO NOTHING;


-- ── 5. Create push_subscriptions table (Phase 10) ────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  keys       JSONB NOT NULL,      -- { p256dh: string, auth: string }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'push_subscriptions'
      AND policyname = 'Users manage own subscriptions'
  ) THEN
    CREATE POLICY "Users manage own subscriptions"
      ON push_subscriptions FOR ALL
      USING  (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $do$;


-- ── Verify results ───────────────────────────────────────────────
SELECT
  column_name,
  table_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'leads'          AND column_name IN ('price', 'scrape_source'))
    OR (table_name = 'scraping_jobs' AND column_name IN ('run_id', 'dataset_id'))
  )
ORDER BY table_name, column_name;

SELECT COUNT(*) AS group_configs_count FROM group_configs;
SELECT COUNT(*) AS push_subscriptions_count FROM push_subscriptions;


-- ── Fix: Remove private/broken group share links ────────────────
-- The share/g/ URLs are private groups that require FB login.
-- Only keep the public maltarealestate group which is confirmed working.
-- Run this AFTER the main migration block above if group_configs table was just created.

DELETE FROM group_configs
WHERE url LIKE '%/share/g/%';

-- Ensure the confirmed-working public group is present
INSERT INTO group_configs (name, url, is_active)
VALUES ('Malta Real Estate (Public)', 'https://www.facebook.com/groups/maltarealestate', true)
ON CONFLICT (url) DO UPDATE SET is_active = true, name = EXCLUDED.name;
