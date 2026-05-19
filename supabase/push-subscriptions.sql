-- Phase 10: Push Subscriptions Table
-- Run this in Supabase Dashboard > SQL Editor

-- Create push_subscriptions table for Web Push API
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  keys       JSONB NOT NULL,       -- { p256dh: string, auth: string }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup by user
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON push_subscriptions(user_id);

-- Row-Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own subscriptions
CREATE POLICY "Users manage own subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS (used by API routes with service key)
