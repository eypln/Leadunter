import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { createClient } from '@supabase/supabase-js';
import { geminiService } from '@/lib/ai/gemini-service';
import { sendScraperJobNotification } from '@/lib/notifications/email-service';
import { validateWebhookSecret } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';
// Processing many items sequentially through Gemini AI can take a while;
// extend the Vercel function timeout (default 300s on Pro, capped by plan).
export const maxDuration = 300;

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
 * Detect scrape source from Facebook URL
 * Returns 'FACEBOOK_MARKETPLACE', 'FACEBOOK_GROUP:GroupName', or 'UNKNOWN'
 */
function detectScrapeSource(facebookUrl: string, groupConfigs: Array<{ name: string; url: string }>): string {
  if (!facebookUrl) return 'UNKNOWN';

  // Check if it's from Facebook Marketplace
  if (facebookUrl.includes('/marketplace/')) {
    return 'FACEBOOK_MARKETPLACE';
  }

  // Check if it's from a known Facebook Group
  if (facebookUrl.includes('/groups/')) {
    // Try to match against configured groups
    for (const group of groupConfigs) {
      const groupId = group.url.split('/groups/')[1]?.replace(/\/$/, '');
      if (groupId && facebookUrl.includes(groupId)) {
        return `FACEBOOK_GROUP:${group.name}`;
      }
    }
    // Generic group - extract group ID from URL
    const groupMatch = facebookUrl.match(/\/groups\/([^/?#]+)/);
    if (groupMatch) {
      return `FACEBOOK_GROUP:${groupMatch[1]}`;
    }
    return 'FACEBOOK_GROUP:Unknown';
  }

  return 'UNKNOWN';
}

/**
 * Map Apify dataset item to our Lead structure
 * Data format from apify/facebook-groups-scraper
 */
async function mapApifyItemToLead(item: any, groupConfigs: Array<{ name: string; url: string }> = []) {
  // Extract basic info
  const text = item.text || '';
  const authorName = item.user?.name || 'Unknown';
  const authorId = item.user?.id || null;
  // NOTE: `facebookUrl` is the GROUP's URL (same for every post in that group) —
  // it must NOT be used as the post's unique identifier. `url` is the actual
  // per-post permalink.
  const facebookUrl = item.facebookUrl || '';
  const postPermalink = item.url || '';
  
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
  
  // Use the post's own permalink as the unique post URL; only fall back to a
  // generated placeholder if Apify didn't return one (never use facebookUrl —
  // it's the group URL and identical for every post).
  const postUrl = postPermalink || `https://www.facebook.com/groups/post/${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // Phase 7: Detect scrape source
  const scrapeSource = detectScrapeSource(facebookUrl, groupConfigs);

  // ===== PHASE 6: AI CLASSIFICATION & ANALYSIS =====
  console.log('[AI] Classifying lead type...');
  let leadType: 'OWNER' | 'CLIENT' = 'OWNER'; // Default
  let intentScore: number | null = null;
  let isAgent = false;

  try {
    // Step 1: Classify lead type (OWNER vs CLIENT)
    leadType = await geminiService.classifyLeadType({
      title: title,
      description: description,
    });
    console.log('[AI] Lead classified as:', leadType);

    // Step 2: If OWNER, analyze intent score and detect agents
    if (leadType === 'OWNER') {
      console.log('[AI] Analyzing OWNER lead...');
      
      // Analyze intent score (1-10)
      intentScore = await geminiService.analyzeIntentScore({
        title: title,
        description: description,
        author_name: authorName,
      });
      console.log('[AI] Intent score:', intentScore);

      // Detect if author is an agent
      isAgent = await geminiService.detectAgent({
        title: title,
        description: description,
        author_name: authorName,
      });
      console.log('[AI] Is agent:', isAgent);
    } else {
      console.log('[AI] CLIENT lead - skipping intent/agent analysis');
    }
  } catch (error) {
    console.error('[AI] Error during AI analysis:', error);
    // Continue with defaults if AI fails
  }

  // Fallback: ensure OWNER leads always have an intent score
  if (leadType === 'OWNER' && intentScore === null) {
    intentScore = 5; // Neutral score when AI analysis fails
    console.log('[AI] Fallback intent score applied: 5');
  }

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
    scrape_source: scrapeSource,
    created_at: new Date().toISOString(),
    
    // AI-powered fields (Phase 6)
    lead_type: leadType,
    intent_score: intentScore,
    is_agent: isAgent,
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
  // Validate webhook secret only when WEBHOOK_SECRET is configured in env.
  // If the env var is missing (e.g. first deploy before it's set in Vercel),
  // we let the request through with a warning so leads are never lost.
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (webhookSecret) {
    if (!validateWebhookSecret(request)) {
      console.warn('[Webhook] Unauthorized request — invalid or missing webhook secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[Webhook] Secret validated ✓');
  } else {
    console.warn('[Webhook] WEBHOOK_SECRET not set — skipping auth (configure in Vercel env vars)');
  }

  try {
    // Parse webhook payload
    const payload = await request.json();

    console.log('[Webhook] ===== APIFY WEBHOOK RECEIVED =====');
    console.log('[Webhook] Full payload:', JSON.stringify(payload, null, 2));

    // Apify's default webhook payload shape is:
    // { userId, createdAt, eventType, eventData: { actorId, actorRunId }, resource: {...full run...} }
    // We also support a legacy flat shape (runId/status/defaultDatasetId at the
    // top level) for backwards compatibility with older payloadTemplate configs.
    const resource = payload?.resource;
    const runId = resource?.id || payload?.eventData?.actorRunId || payload?.runId;
    const status = resource?.status || payload?.status;
    const defaultDatasetId = resource?.defaultDatasetId || payload?.defaultDatasetId;
    const startedAt = resource?.startedAt || payload?.startedAt;
    const finishedAt = resource?.finishedAt || payload?.finishedAt;

    console.log('[Webhook] Run ID:', runId);
    console.log('[Webhook] Status:', status);
    console.log('[Webhook] Dataset ID:', defaultDatasetId);

    // Check if run was successful
    if (status !== 'SUCCEEDED') {
      console.error('[Webhook] Scraping run failed:', status);
      
      // ===== PHASE 8: SEND FAILURE EMAIL NOTIFICATION =====
      try {
        const duration = finishedAt && startedAt
          ? Math.floor((new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000)
          : 0;

        await sendScraperJobNotification({
          jobId: runId || 'unknown',
          status: 'failure',
          leadsFound: 0,
          startedAt: startedAt ? new Date(startedAt) : new Date(),
          completedAt: finishedAt ? new Date(finishedAt) : new Date(),
          duration: duration,
          errorMessage: `Scraping run status: ${status}`,
          source: 'FACEBOOK_GROUPS',
        });
        console.log('[Webhook] Failure email notification sent');
      } catch (emailError) {
        console.error('[Webhook] Failed to send failure email:', emailError);
      }

      return NextResponse.json({
        success: false,
        message: 'Scraping run did not succeed',
        status: status,
      });
    }

    if (!defaultDatasetId) {
      console.error('[Webhook] No dataset ID in payload — cannot fetch results');
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

    console.log(`[Webhook] Dataset fetched — ${items.length} items found`);

    // Phase 7: Fetch group configs for source detection
    const { data: groupConfigs, error: groupsErr } = await supabase
      .from('group_configs')
      .select('name, url');
    if (groupsErr) console.warn('[Webhook] Could not load group_configs:', groupsErr.message);
    const groups = groupConfigs || [];
    console.log(`[Webhook] Loaded ${groups.length} group configs for source detection`);

    // Process each item
    let newLeads = 0;
    let duplicates = 0;
    let errors = 0;
    let ownerLeads = 0;
    let clientLeads = 0;
    let agentsFiltered = 0;

    for (const item of items) {
      try {
        // Cheap duplicate check BEFORE running AI classification — avoids
        // wasting Gemini calls (and Vercel function time) on posts we
        // already have, which was causing the whole webhook to time out
        // and never persist anything when a run returned many items.
        // Use `url` (the post's own permalink), NOT `facebookUrl` (the group's
        // URL, identical for every post in that group).
        const rawPostUrl = (item.url as string | undefined) || '';
        if (rawPostUrl && (await leadExists(rawPostUrl))) {
          console.log('[Webhook] Duplicate (pre-AI), skipping:', rawPostUrl);
          duplicates++;
          continue;
        }

        // Map to our lead structure (with AI classification)
        const lead = await mapApifyItemToLead(item, groups);

        // Skip if no post URL (invalid data)
        if (!lead.post_url) {
          console.warn('[Webhook] Skipping item — no post URL');
          errors++;
          continue;
        }

        // Safety-net duplicate check (covers items without a facebookUrl,
        // e.g. two items in the same batch resolving to the same post_url)
        const exists = await leadExists(lead.post_url);
        if (exists) {
          console.log('[Webhook] Duplicate, skipping:', lead.post_url);
          duplicates++;
          continue;
        }

        // Track lead types
        if (lead.lead_type === 'OWNER') {
          ownerLeads++;
          if (lead.is_agent) {
            agentsFiltered++;
            console.log('[Webhook] Agent detected (stored + flagged):', lead.author_name);
          }
        } else {
          clientLeads++;
        }

        // Insert into database
        await insertLead(lead);
        console.log(`[Webhook] ✅ Inserted: "${lead.title?.substring(0, 60)}" (${lead.lead_type}, score:${lead.intent_score})`);
        newLeads++;

      } catch (error) {
        console.error('[Webhook] ❌ Error processing item:', error);
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

    console.log('[Webhook] ===== PROCESSING COMPLETE =====');
    console.log(`[Webhook] Total items   : ${items.length}`);
    console.log(`[Webhook] New leads     : ${newLeads}`);
    console.log(`[Webhook] OWNER leads   : ${ownerLeads}`);
    console.log(`[Webhook] CLIENT leads  : ${clientLeads}`);
    console.log(`[Webhook] Agents flagged: ${agentsFiltered}`);
    console.log(`[Webhook] Duplicates    : ${duplicates}`);
    console.log(`[Webhook] Errors        : ${errors}`);

    // ===== PHASE 8: SEND EMAIL NOTIFICATION =====
    try {
      const duration = Math.floor(
        (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000
      );

      await sendScraperJobNotification({
        jobId: runId,
        status: 'success',
        leadsFound: newLeads,
        ownerLeads: ownerLeads,
        clientLeads: clientLeads,
        agentsDetected: agentsFiltered,
        startedAt: new Date(startedAt),
        completedAt: new Date(finishedAt),
        duration: duration,
        source: 'FACEBOOK_GROUPS',
      });
      console.log('[Webhook] Email notification sent successfully');
    } catch (emailError) {
      console.error('[Webhook] Failed to send email notification:', emailError);
      // Don't fail the webhook if email fails
    }

    // ===== PHASE 10: SEND PUSH NOTIFICATION =====
    if (newLeads > 0) {
      try {
        const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        await fetch(`${appUrl}/api/notifications/push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.WEBHOOK_SECRET || ''}`,
          },
          body: JSON.stringify({
            title: '🎯 New Leads Found!',
            body: `${newLeads} new lead${newLeads > 1 ? 's' : ''} (${ownerLeads} owner, ${clientLeads} client)`,
            tag: 'new-leads',
            url: '/dashboard',
          }),
        });
        console.log('[Webhook] Push notification dispatched');
      } catch (pushError) {
        console.error('[Webhook] Failed to send push notification:', pushError);
        // Non-blocking — don't fail the webhook
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      stats: {
        totalItems: items.length,
        newLeads: newLeads,
        ownerLeads: ownerLeads,
        clientLeads: clientLeads,
        agentsDetected: agentsFiltered,
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
