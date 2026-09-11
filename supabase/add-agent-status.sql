-- Add an "AGENT" lead status so agent posts that slip past the scraper
-- filter can be manually flagged from the dashboard instead of just SKIPPED.
-- Run this once in the Supabase SQL editor.

ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'AGENT';
