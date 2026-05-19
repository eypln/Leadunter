-- Migration: Add Apify-specific fields to scraping_jobs table
-- Run this in Supabase SQL Editor after running schema.sql

-- Add new columns for Apify integration
ALTER TABLE scraping_jobs
ADD COLUMN IF NOT EXISTS run_id TEXT,
ADD COLUMN IF NOT EXISTS dataset_id TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_run_id ON scraping_jobs(run_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_dataset_id ON scraping_jobs(dataset_id);

-- Add comments for documentation
COMMENT ON COLUMN scraping_jobs.run_id IS 'Apify Actor run ID';
COMMENT ON COLUMN scraping_jobs.dataset_id IS 'Apify dataset ID containing scraped data';
