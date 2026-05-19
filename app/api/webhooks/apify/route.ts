import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { createClient } from '@supabase/supabase-js';

/**
 * API Route: Apify Webhook Receiver
 * 
 * This endpoint receives webhook notifications from Apify when a scraping run completes.
 * It then:
 * 1. Fetches the dataset from Apify
 * 2. Processes and filters the data
 * 3. Stores unique leads in Supabase
 * 
 * Webhook Payload from Apify:
 * {
 *   runId: string,
 *   status: 'SUCCEEDED' | 'FAILED',
 *   defaultDatasetId: string,
 *   startedAt: string,
 *   finishedAt: string
 * }
 */

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Extract phone number from text using regex
 */
function extractPhoneNumber(text: string): string | null {
  if (!text) return null;

  // Common phone number patterns
  const patterns = [
    /\+?\d{1,4}[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}/g, // International format
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, // US format
    /\d{2,4}[\s-]?\d{6,8}/g, // European format
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Return the first match, cleaned up
      return matches[0].replace(/[\s-]/g, '');
    }
  }

  return null;
}

/**
 * Map Apify dataset item to our Lead structure
 * Data format from apify/facebook-groups-scraper
 */
function mapApifyItemToLead(item: any) {
  // Extract basic info
  const text = item.text || '';
  const authorName = item.user?.name || 'Unknown';
  const authorId = item.user?.id || null;
  const facebookUrl = item.facebookUrl || '';
  
  // Extract title (first 200 chars of text)
  const title = text.substring(0, 200) || 'No title';
  
  // Extract price from attachments
  let price = null;
  let location = null;
  let description = text;
  
  if (item.attachments && item.attachments.length > 0) {
    const firstAttachment = item.attachments[0];
    
    // Check if it's a product listing with properties
    if (firstAttachment.properties && Array.isArray(firstAttachment.properties)) {
      for (const prop of firstAttachment.properties) {
        if (prop.key === 'price_amount' && prop.value?.text) {
          // Convert price from cents to euros (e.g., "55000" -> 550)
          const priceAmount = parseInt(prop.value.text);
          if (!isNaN(priceAmount)) {
            price = Math.round(priceAmount / 100);
          }
        }
        if (prop.key === 'pickup_note' && prop.value?.text) {
          location = prop.value.text;
        }
        if (prop.key === 'description' && prop.value?.text) {
          description = prop.value.text;
        }
      }
    }
  }
  
  // Extract image URLs from attachments
  const imageUrls: string[] = [];
  if (item.attachments && Array.isArray(item.attachments)) {
    for (const attachment of item.attachments) {
      // Check for thumbnail or image URL
      if (attachment.thumbnail) {
        imageUrls.push(attachment.thumbnail);
      } else if (attachment.image?.uri) {
        imageUrls.push(attachment.image.uri);
      }
    }
  }
  
  // Extract phone number from text
  const phone = extractPhoneNumber(description || text);
  
  // Generate post URL (we don't have individual post URL, use group URL)
  // In a real scenario, you'd need to construct this from post ID
  const postUrl = facebookUrl || `https://www.facebook.com/groups/post/${Date.now()}`;

  return {
    post_url: postUrl,
    title: title,
    description: description,
    author_name: authorName,
    author_id: authorId,
    location: location,
    phone: phone,
    price: price,
    image_urls: imageUrls,
    images_downloaded: false,
    status: 'NEW',
    created_at: new Date().toISOString(),
    
    // These will be populated by AI in Phase 6
    // For now, set defaults
    lead_type: 'OWNER', // Default to OWNER, will be classified by AI later
    intent_score: null,
    is_agent: false,
  };
}

/**
 * Check if lead already exists in database
 */
async function leadExists(postUrl: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('leads')
    .select('id')
    .eq('post_url', postUrl)
    .single();

  return !!data && !error;
}

/**
 * Insert lead into database
 */
async function insertLead(lead: any) {
  const { data, error } = await supabase
    .from('leads')
    .insert(lead)
    .select()
    .single();

  if (error) {
    console.error('[Webhook] Error inserting lead:', error);
    throw error;
  }

  return data;
}

/**
 * POST handler - receives webhook from Apify
 */
export async function POST(request: NextRequest) {
  try {
    // Parse webhook payload
    const payload = await request.json();
    
    console.log('[Webhook] Received Apify webhook');
    console.log('[Webhook] Payload:', JSON.stringify(payload, null, 2));

    const { runId, status, defaultDatasetId, startedAt, finishedAt } = payload;

    // Check if run was successful
    if (status !== 'SUCCEEDED') {
      console.error('[Webhook] Scraping run failed:', status);
      return NextResponse.json({
        success: false,
        message: 'Scraping run did not succeed',
        status: status,
      });
    }

    if (!defaultDatasetId) {
      console.error('[Webhook] No dataset ID provided');
      return NextResponse.json({
        success: false,
        message: 'No dataset ID in webhook payload',
      });
    }

    // Initialize Apify client
    const apiToken = process.env.APIFY_API_TOKEN;
    if (!apiToken) {
      throw new Error('APIFY_API_TOKEN not configured');
    }

    const client = new ApifyClient({ token: apiToken });

    // Fetch dataset items
    console.log('[Webhook] Fetching dataset:', defaultDatasetId);
    const dataset = await client.dataset(defaultDatasetId);
    const { items } = await dataset.listItems();

    console.log('[Webhook] Found', items.length, 'items in dataset');

    // Process each item
    let newLeads = 0;
    let duplicates = 0;
    let errors = 0;

    for (const item of items) {
      try {
        // Map to our lead structure
        const lead = mapApifyItemToLead(item);

        // Skip if no post URL (invalid data)
        if (!lead.post_url) {
          console.warn('[Webhook] Skipping item without post URL');
          errors++;
          continue;
        }

        // Check for duplicates
        const exists = await leadExists(lead.post_url);
        if (exists) {
          console.log('[Webhook] Duplicate lead:', lead.post_url);
          duplicates++;
          continue;
        }

        // Insert into database
        await insertLead(lead);
        console.log('[Webhook] Inserted new lead:', lead.title);
        newLeads++;

      } catch (error) {
        console.error('[Webhook] Error processing item:', error);
        errors++;
      }
    }

    // Log scraping job to database
    try {
      await supabase.from('scraping_jobs').insert({
        source: 'apify',
        status: 'COMPLETED',
        leads_found: newLeads,
        started_at: startedAt,
        completed_at: finishedAt,
        run_id: runId,
        dataset_id: defaultDatasetId,
      });
    } catch (error) {
      console.error('[Webhook] Error logging scraping job:', error);
    }

    console.log('[Webhook] Processing complete');
    console.log('[Webhook] New leads:', newLeads);
    console.log('[Webhook] Duplicates:', duplicates);
    console.log('[Webhook] Errors:', errors);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      stats: {
        totalItems: items.length,
        newLeads: newLeads,
        duplicates: duplicates,
        errors: errors,
      },
      runId: runId,
    });

  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - for testing webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'Apify webhook endpoint is active',
    endpoint: '/api/webhooks/apify',
    method: 'POST',
    note: 'This endpoint receives webhook notifications from Apify',
  });
}
