/**
 * Admin Migration Route
 *
 * GET  /api/admin/migrate  → check which migrations are pending
 * POST /api/admin/migrate  → run pending migrations via Supabase Management API
 *
 * IMPORTANT: Delete this file after migrations are applied.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Schema checks (read-only, work with service role) ───────────────────────

async function columnExists(table: string, column: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('column_exists', { p_table: table, p_column: column })
    .maybeSingle();
  
  // If rpc doesn't exist, fall back to information_schema query
  if (error) {
    // We can't directly query information_schema via supabase-js REST
    // so we try a dummy select and check for the column error
    const { error: colError } = await supabase
      .from(table as never)
      .select(column)
      .limit(0);
    // If error code is 42703 (column doesn't exist), return false
    if (colError?.code === '42703') return false;
    // If no error or different error, column likely exists
    return !colError || colError.code !== '42703';
  }
  return !!data;
}

async function tableExists(table: string): Promise<boolean> {
  const { error } = await supabase
    .from(table as never)
    .select('id')
    .limit(0);
  // 42P01 = table does not exist
  return !error || error.code !== '42P01';
}

// ─── GET: Check migration status ─────────────────────────────────────────────

export async function GET() {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();
  const checks = await Promise.all([
    columnExists('leads', 'price').then(v => ({ key: 'leads.price', done: v })),
    columnExists('scraping_jobs', 'run_id').then(v => ({ key: 'scraping_jobs.run_id', done: v })),
    columnExists('scraping_jobs', 'dataset_id').then(v => ({ key: 'scraping_jobs.dataset_id', done: v })),
    columnExists('leads', 'scrape_source').then(v => ({ key: 'leads.scrape_source', done: v })),
    tableExists('group_configs').then(v => ({ key: 'group_configs table', done: v })),
    tableExists('push_subscriptions').then(v => ({ key: 'push_subscriptions table', done: v })),
  ]);

  // Count seeded groups
  let groupCount = 0;
  if (checks.find(c => c.key === 'group_configs table')?.done) {
    const { count } = await supabase
      .from('group_configs')
      .select('*', { count: 'exact', head: true });
    groupCount = count ?? 0;
  }

  const pending = checks.filter(c => !c.done);

  return NextResponse.json({
    checks: checks.reduce((acc, c) => ({ ...acc, [c.key]: c.done ? '✅' : '❌ PENDING' }), {}),
    groupConfigsCount: groupCount,
    pendingCount: pending.length,
    allApplied: pending.length === 0,
    pending: pending.map(p => p.key),
  });
}

// ─── POST: Run migrations via Management API ──────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();
  // Require a simple secret to avoid accidental triggers
  const { secret } = await req.json().catch(() => ({}));
  if (secret !== 'run-migrations-now') {
    return NextResponse.json({ error: 'Missing secret' }, { status: 401 });
  }

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!
    .replace('https://', '')
    .split('.')[0];

  // Management API personal token can be passed as env var
  const mgmtToken = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY;

  const migrationSQL = `
-- ============================================================
-- Lead Hunter: Combined Migration SQL
-- Run this in Supabase Dashboard > SQL Editor if API fails
-- ============================================================

-- 1. Add price field to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS price INTEGER;
CREATE INDEX IF NOT EXISTS idx_leads_price ON leads(price) WHERE price IS NOT NULL;

-- 2. Add Apify fields to scraping_jobs
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS run_id TEXT;
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS dataset_id TEXT;
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_run_id ON scraping_jobs(run_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_dataset_id ON scraping_jobs(dataset_id);

-- 3. Add scrape_source to leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scrape_source TEXT DEFAULT 'UNKNOWN';
CREATE INDEX IF NOT EXISTS idx_leads_scrape_source ON leads(scrape_source);

-- 4. Create group_configs table
CREATE TABLE IF NOT EXISTS group_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_group_configs_active ON group_configs(is_active);

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

ALTER TABLE group_configs ENABLE ROW LEVEL SECURITY;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='group_configs' AND policyname='Service role has full access to group_configs') THEN
    CREATE POLICY "Service role has full access to group_configs" ON group_configs FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='group_configs' AND policyname='Authenticated users can read group_configs') THEN
    CREATE POLICY "Authenticated users can read group_configs" ON group_configs FOR SELECT TO authenticated USING (true);
  END IF;
END $do$;

INSERT INTO group_configs (name, url, is_active) VALUES
  ('Malta Property Group 1', 'https://www.facebook.com/share/g/1DkanJFSpM/', true),
  ('Malta Property Group 2', 'https://www.facebook.com/share/g/1GqUW2Tojk/', true),
  ('Malta Property Group 3', 'https://www.facebook.com/share/g/14aPUrKb2Kq/', true),
  ('Malta Property Group 4', 'https://www.facebook.com/share/g/1EEAoK5eTx/', true),
  ('Malta Property Group 5', 'https://www.facebook.com/share/g/14bjR19Sbeg', true)
ON CONFLICT (url) DO NOTHING;

-- 5. Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  keys       JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_subscriptions' AND policyname='Users manage own subscriptions') THEN
    CREATE POLICY "Users manage own subscriptions" ON push_subscriptions FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $do$;
  `.trim();

  // Try Management API
  try {
    const resp = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mgmtToken}`,
        },
        body: JSON.stringify({ query: migrationSQL }),
      }
    );

    if (resp.ok) {
      return NextResponse.json({
        success: true,
        message: 'All migrations applied via Management API',
      });
    }

    const errText = await resp.text();
    // Management API failed (likely needs personal access token)
    // Return the SQL so the user can run it manually
    return NextResponse.json({
      success: false,
      managementApiError: `HTTP ${resp.status}: ${errText}`,
      fallback: 'Run the SQL below in Supabase Dashboard > SQL Editor',
      sql: migrationSQL,
    }, { status: 200 });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      fallback: 'Run the SQL below in Supabase Dashboard > SQL Editor',
      sql: migrationSQL,
    }, { status: 200 });
  }
}
