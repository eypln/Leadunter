#!/bin/bash

# Supabase credentials
SUPABASE_URL="https://pdfnojbaivqxstqakfpc.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkZm5vamJhaXZxeHN0cWFrZnBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA1ODg0OSwiZXhwIjoyMDk0NjM0ODQ5fQ.-XiFBdtuhfg9ElJCUoar2v04Lf61IEbUO7VbFIwIOzM"
PROJECT_REF="pdfnojbaivqxstqakfpc"

run_sql() {
  local label="$1"
  local sql="$2"
  echo ""
  echo "=== Running: $label ==="
  
  RESPONSE=$(curl -s -X POST \
    "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(echo "$sql" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}")
  
  echo "Response: $RESPONSE"
}

# ============================================
# Migration 1: Add price field to leads
# ============================================
run_sql "add-price-field" "
ALTER TABLE leads ADD COLUMN IF NOT EXISTS price INTEGER;
COMMENT ON COLUMN leads.price IS 'Monthly rent price in EUR. For OWNER: asking price. For CLIENT: maximum budget';
CREATE INDEX IF NOT EXISTS idx_leads_price ON leads(price) WHERE price IS NOT NULL;
"

# ============================================
# Migration 2: Add Apify fields to scraping_jobs
# ============================================
run_sql "add-apify-fields" "
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS run_id TEXT;
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS dataset_id TEXT;
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_run_id ON scraping_jobs(run_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_dataset_id ON scraping_jobs(dataset_id);
COMMENT ON COLUMN scraping_jobs.run_id IS 'Apify Actor run ID';
COMMENT ON COLUMN scraping_jobs.dataset_id IS 'Apify dataset ID containing scraped data';
"

# ============================================
# Migration 3: Phase 7 - groups scraper
# ============================================
run_sql "phase7-groups-scraper-part1" "
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scrape_source TEXT DEFAULT 'UNKNOWN';
CREATE INDEX IF NOT EXISTS idx_leads_scrape_source ON leads(scrape_source);
COMMENT ON COLUMN leads.scrape_source IS 'Source of the lead: FACEBOOK_MARKETPLACE, FACEBOOK_GROUP:GroupName, or UNKNOWN';
"

run_sql "phase7-groups-scraper-part2" "
CREATE TABLE IF NOT EXISTS group_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_group_configs_active ON group_configs(is_active);
"

run_sql "phase7-groups-scraper-trigger" "
CREATE OR REPLACE FUNCTION update_group_configs_updated_at()
RETURNS TRIGGER AS \$\$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_group_configs_updated_at ON group_configs;
CREATE TRIGGER trigger_group_configs_updated_at
  BEFORE UPDATE ON group_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_group_configs_updated_at();
"

run_sql "phase7-groups-rls" "
ALTER TABLE group_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS \"Service role has full access to group_configs\" ON group_configs;
CREATE POLICY \"Service role has full access to group_configs\"
  ON group_configs FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS \"Authenticated users can read group_configs\" ON group_configs;
CREATE POLICY \"Authenticated users can read group_configs\"
  ON group_configs FOR SELECT TO authenticated USING (true);
"

run_sql "phase7-seed-groups" "
INSERT INTO group_configs (name, url, is_active) VALUES
  ('Malta Property Group 1', 'https://www.facebook.com/share/g/1DkanJFSpM/', true),
  ('Malta Property Group 2', 'https://www.facebook.com/share/g/1GqUW2Tojk/', true),
  ('Malta Property Group 3', 'https://www.facebook.com/share/g/14aPUrKb2Kq/', true),
  ('Malta Property Group 4', 'https://www.facebook.com/share/g/1EEAoK5eTx/', true),
  ('Malta Property Group 5', 'https://www.facebook.com/share/g/14bjR19Sbeg', true)
ON CONFLICT (url) DO NOTHING;
"

# ============================================
# Migration 4: Push subscriptions
# ============================================
run_sql "push-subscriptions" "
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  keys       JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY \"Users manage own subscriptions\"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
"

echo ""
echo "=== All migrations completed ==="
