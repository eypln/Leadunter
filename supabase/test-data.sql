-- Test Data for Lead Hunter
-- Run this in Supabase SQL Editor to populate with sample data

-- Insert sample OWNER leads
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
) VALUES 
(
  'https://facebook.com/marketplace/item/123456',
  '2 Bedroom Apartment in Sliema - Direct from Owner',
  'Beautiful 2 bedroom apartment available for rent in Sliema. Direct from owner, no agency fees. Fully furnished, sea view. Available from June 1st. Contact: 99123456',
  'John Doe',
  'fb_john_123',
  'Sliema, Malta',
  '+35699123456',
  'OWNER',
  9,
  false,
  'NEW',
  '["https://picsum.photos/800/600?random=1", "https://picsum.photos/800/600?random=2"]'::jsonb
),
(
  'https://facebook.com/marketplace/item/234567',
  '3 Bedroom House in Valletta',
  'Spacious 3 bedroom townhouse in the heart of Valletta. Owner renting directly. No commission. Pets allowed. Call 79888777',
  'Maria Borg',
  'fb_maria_234',
  'Valletta, Malta',
  '+35679888777',
  'OWNER',
  8,
  false,
  'NEW',
  '["https://picsum.photos/800/600?random=3", "https://picsum.photos/800/600?random=4", "https://picsum.photos/800/600?random=5"]'::jsonb
),
(
  'https://facebook.com/marketplace/item/345678',
  'Studio Apartment St. Julians - Available Now',
  'Modern studio in St. Julians. Direct owner, no fees. Fully equipped kitchen, AC, WiFi included. Perfect for single person or couple.',
  'David Camilleri',
  'fb_david_345',
  'St. Julians, Malta',
  NULL,
  'OWNER',
  7,
  false,
  'NEW',
  '["https://picsum.photos/800/600?random=6"]'::jsonb
),
(
  'https://facebook.com/marketplace/item/456789',
  'Luxury 2 Bed Apartment - Multiple Properties Available',
  'Professional letting service. We have multiple 2 bedroom apartments across Malta. Competitive rates, full property management. Contact our office for viewings.',
  'QuickLets Agency',
  'fb_quicklets_456',
  'Malta',
  '+35621234567',
  'OWNER',
  3,
  true,
  'SKIPPED',
  '["https://picsum.photos/800/600?random=7", "https://picsum.photos/800/600?random=8"]'::jsonb
);

-- Insert sample CLIENT leads
INSERT INTO leads (
  post_url,
  title,
  description,
  author_name,
  author_id,
  location,
  lead_type,
  status,
  image_urls
) VALUES 
(
  'https://facebook.com/groups/malta-rentals/posts/789012',
  'Looking for 1 bedroom apartment in Sliema/St. Julians',
  'Hi everyone! I am looking for a 1 bedroom apartment in Sliema or St. Julians area. Budget 800-1000 EUR per month. Moving in June. Long term rental. Please contact me if you have anything available.',
  'Jane Smith',
  'fb_jane_789',
  'Malta',
  'CLIENT',
  'NEW',
  '[]'::jsonb
),
(
  'https://facebook.com/groups/malta-rentals/posts/890123',
  'Need 2 bed apartment for family - Urgent',
  'Looking for 2 bedroom apartment urgently. Family of 3 (couple + 1 child). Budget up to 1200 EUR. Prefer Msida, Gzira or Swieqi. Need parking space. Can move in immediately.',
  'Ahmed Hassan',
  'fb_ahmed_890',
  'Malta',
  'CLIENT',
  'NEW',
  '[]'::jsonb
),
(
  'https://facebook.com/groups/malta-rentals/posts/901234',
  'Student looking for shared accommodation',
  'Hi! I am a student starting at University of Malta in September. Looking for a room in shared apartment or studio. Budget 400-600 EUR. Prefer areas close to university or with good bus connections.',
  'Sophie Martin',
  'fb_sophie_901',
  'Malta',
  'CLIENT',
  'RESPONDED',
  '[]'::jsonb
);

-- Insert sample scraping job
INSERT INTO scraping_jobs (
  source,
  status,
  leads_found,
  started_at,
  completed_at
) VALUES 
(
  'MARKETPLACE',
  'COMPLETED',
  4,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '1 hour 45 minutes'
),
(
  'GROUP: Malta Rentals',
  'COMPLETED',
  3,
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '45 minutes'
);

-- Verify data
SELECT 'OWNER Leads:' as type, COUNT(*) as count FROM leads WHERE lead_type = 'OWNER'
UNION ALL
SELECT 'CLIENT Leads:' as type, COUNT(*) as count FROM leads WHERE lead_type = 'CLIENT'
UNION ALL
SELECT 'Total Leads:' as type, COUNT(*) as count FROM leads
UNION ALL
SELECT 'Scraping Jobs:' as type, COUNT(*) as count FROM scraping_jobs;
