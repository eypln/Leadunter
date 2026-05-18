-- Add price field to leads table
-- Run this in Supabase SQL Editor

-- Add price column (monthly rent in EUR)
ALTER TABLE leads
ADD COLUMN price INTEGER;

-- Add comment for clarity
COMMENT ON COLUMN leads.price IS 'Monthly rent price in EUR. For OWNER: asking price. For CLIENT: maximum budget (upper range if budget range given)';

-- Add index for price-based queries
CREATE INDEX idx_leads_price ON leads(price) WHERE price IS NOT NULL;

-- Update existing test data with sample prices
UPDATE leads 
SET price = 1200 
WHERE post_url = 'https://facebook.com/marketplace/item/123456';

UPDATE leads 
SET price = 1500 
WHERE post_url = 'https://facebook.com/marketplace/item/234567';

UPDATE leads 
SET price = 800 
WHERE post_url = 'https://facebook.com/marketplace/item/345678';

UPDATE leads 
SET price = 1800 
WHERE post_url = 'https://facebook.com/marketplace/item/456789';

UPDATE leads 
SET price = 1000 
WHERE post_url = 'https://facebook.com/groups/malta-rentals/posts/789012';

UPDATE leads 
SET price = 1200 
WHERE post_url = 'https://facebook.com/groups/malta-rentals/posts/890123';

UPDATE leads 
SET price = 600 
WHERE post_url = 'https://facebook.com/groups/malta-rentals/posts/901234';

-- Verify the changes
SELECT id, title, lead_type, price, location 
FROM leads 
ORDER BY price DESC;
