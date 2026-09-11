-- Lead Hunter Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE lead_type AS ENUM ('OWNER', 'CLIENT');
CREATE TYPE lead_status AS ENUM ('NEW', 'RESPONDED', 'SKIPPED', 'INTERESTED', 'AGENT');
CREATE TYPE message_template_type AS ENUM ('WHATSAPP', 'MESSENGER', 'FACEBOOK_COMMENT');
CREATE TYPE scraping_job_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  facebook_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_users_facebook_id ON users(facebook_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_id TEXT NOT NULL,
  location TEXT,
  phone TEXT,
  lead_type lead_type NOT NULL,
  intent_score INTEGER CHECK (intent_score >= 1 AND intent_score <= 10),
  is_agent BOOLEAN DEFAULT FALSE,
  status lead_status DEFAULT 'NEW',
  image_urls JSONB DEFAULT '[]'::jsonb,
  images_downloaded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_leads_lead_type ON leads(lead_type);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_author_id ON leads(author_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_is_agent ON leads(is_agent) WHERE lead_type = 'OWNER';
CREATE INDEX idx_leads_intent_score ON leads(intent_score DESC) WHERE lead_type = 'OWNER';

-- ============================================
-- LEAD_IMAGES TABLE
-- ============================================
CREATE TABLE lead_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_lead_images_lead_id ON lead_images(lead_id);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  template_type message_template_type NOT NULL,
  message_text TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_messages_lead_id ON messages(lead_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at);

-- ============================================
-- SCRAPING_JOBS TABLE
-- ============================================
CREATE TABLE scraping_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  status scraping_job_status DEFAULT 'PENDING',
  leads_found INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Index for faster queries
CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX idx_scraping_jobs_started_at ON scraping_jobs(started_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp on leads table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (we'll refine this later with proper auth)
-- In production, you should restrict based on authenticated users

CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on leads" ON leads FOR ALL USING (true);
CREATE POLICY "Allow all operations on lead_images" ON lead_images FOR ALL USING (true);
CREATE POLICY "Allow all operations on messages" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all operations on scraping_jobs" ON scraping_jobs FOR ALL USING (true);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment to insert sample data
/*
INSERT INTO leads (
  post_url,
  title,
  description,
  author_name,
  author_id,
  location,
  phone,
  lead_type,
  intent_score,
  is_agent,
  status,
  image_urls
) VALUES (
  'https://facebook.com/marketplace/item/123456',
  '2 Bedroom Apartment in Sliema',
  'Beautiful 2 bedroom apartment available for rent. Direct from owner, no agency fees. Contact: 99123456',
  'John Doe',
  'fb_12345',
  'Sliema, Malta',
  '+35699123456',
  'OWNER',
  9,
  false,
  'NEW',
  '["https://example.com/image1.jpg", "https://example.com/image2.jpg"]'::jsonb
);

INSERT INTO leads (
  post_url,
  title,
  description,
  author_name,
  author_id,
  location,
  lead_type,
  status
) VALUES (
  'https://facebook.com/groups/malta-rentals/posts/789012',
  'Looking for 1 bedroom apartment',
  'Hi, I am looking for a 1 bedroom apartment in Valletta or Sliema. Budget 800-1000 EUR. Moving in June.',
  'Jane Smith',
  'fb_67890',
  'Malta',
  'CLIENT',
  'NEW'
);
*/
