import https from 'https';

const PROJECT_REF = 'pdfnojbaivqxstqakfpc';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkZm5vamJhaXZxeHN0cWFrZnBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTA1ODg0OSwiZXhwIjoyMDk0NjM0ODQ5fQ.-XiFBdtuhfg9ElJCUoar2v04Lf61IEbUO7VbFIwIOzM';

function runSQL(label, sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    console.log(`\n=== Running: ${label} ===`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Success');
          } else {
            console.log('❌ Error:', JSON.stringify(parsed, null, 2));
          }
        } catch {
          console.log('Response:', data.substring(0, 200));
        }
        resolve();
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const migrations = [
  {
    label: '1. Add price field to leads',
    sql: `
ALTER TABLE leads ADD COLUMN IF NOT EXISTS price INTEGER;
COMMENT ON COLUMN leads.price IS 'Monthly rent price in EUR';
CREATE INDEX IF NOT EXISTS idx_leads_price ON leads(price) WHERE price IS NOT NULL;
`
  },
  {
    label: '2. Add Apify fields to scraping_jobs',
    sql: `
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS run_id TEXT;
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS dataset_id TEXT;
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_run_id ON scraping_jobs(run_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_dataset_id ON scraping_jobs(dataset_id);
`
  },
  {
    label: '3a. Add scrape_source column to leads',
    sql: `
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scrape_source TEXT DEFAULT 'UNKNOWN';
CREATE INDEX IF NOT EXISTS idx_leads_scrape_source ON leads(scrape_source);
`
  },
  {
    label: '3b. Create group_configs table',
    sql: `
CREATE TABLE IF NOT EXISTS group_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_group_configs_active ON group_configs(is_active);
`
  },
  {
    label: '3c. Create updated_at trigger for group_configs',
    sql: `
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
`
  },
  {
    label: '3d. RLS for group_configs',
    sql: `
ALTER TABLE group_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role has full access to group_configs" ON group_configs;
CREATE POLICY "Service role has full access to group_configs"
  ON group_configs FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can read group_configs" ON group_configs;
CREATE POLICY "Authenticated users can read group_configs"
  ON group_configs FOR SELECT TO authenticated USING (true);
`
  },
  {
    label: '3e. Seed Facebook groups',
    sql: `
INSERT INTO group_configs (name, url, is_active) VALUES
  ('Malta Property Group 1', 'https://www.facebook.com/share/g/1DkanJFSpM/', true),
  ('Malta Property Group 2', 'https://www.facebook.com/share/g/1GqUW2Tojk/', true),
  ('Malta Property Group 3', 'https://www.facebook.com/share/g/14aPUrKb2Kq/', true),
  ('Malta Property Group 4', 'https://www.facebook.com/share/g/1EEAoK5eTx/', true),
  ('Malta Property Group 5', 'https://www.facebook.com/share/g/14bjR19Sbeg', true)
ON CONFLICT (url) DO NOTHING;
`
  },
  {
    label: '4. Create push_subscriptions table',
    sql: `
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  keys       JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own subscriptions" ON push_subscriptions;
CREATE POLICY "Users manage own subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
`
  },
];

async function main() {
  console.log('Starting Supabase migrations...');
  for (const { label, sql } of migrations) {
    await runSQL(label, sql);
    // small delay between requests
    await new Promise(r => setTimeout(r, 300));
  }
  console.log('\n=== All migrations done ===');
}

main().catch(console.error);
