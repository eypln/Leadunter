import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API Route: Trigger Apify Scraper
 * 
 * This endpoint starts an Apify Actor to scrape Facebook Groups for leads.
 * It uses a webhook architecture to avoid Vercel timeout issues:
 * 1. Fetches active groups from group_configs table
 * 2. Start the Apify Actor with webhook configuration
 * 3. Return immediately (no waiting for completion)
 * 4. Apify will call our webhook when done
 * 
 * Usage:
 * - POST /api/scraper/trigger
 * - Body: { maxPosts?: number, source?: 'ALL' | 'GROUPS' }
 * 
 * Environment Variables Required:
 * - APIFY_API_TOKEN: Your Apify API token
 * - APIFY_ACTOR_ID: The Apify Actor to run (e.g., "apify/facebook-groups-scraper")
 * - APIFY_WEBHOOK_URL: Your webhook URL (e.g., "https://your-domain.vercel.app/api/webhooks/apify")
 */

export async function POST(request: NextRequest) {
  // Only authenticated users can manually trigger a scrape
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();

  try {
    // Validate environment variables
    const apiToken = process.env.APIFY_API_TOKEN;
    const actorId = process.env.APIFY_ACTOR_ID;
    const webhookUrl = process.env.APIFY_WEBHOOK_URL;

    if (!apiToken) {
      return NextResponse.json(
        { error: 'APIFY_API_TOKEN not configured' },
        { status: 500 }
      );
    }

    if (!actorId) {
      return NextResponse.json(
        { error: 'APIFY_ACTOR_ID not configured' },
        { status: 500 }
      );
    }

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'APIFY_WEBHOOK_URL not configured' },
        { status: 500 }
      );
    }

    // Initialize Apify client
    const client = new ApifyClient({
      token: apiToken,
    });

    // Get optional configuration from request body
    const body = await request.json().catch(() => ({}));
    const maxPosts = body.maxPosts || parseInt(process.env.SCRAPER_MAX_POSTS_PER_RUN || '50');

    // Phase 7: Fetch active groups from database
    let groupUrls: string[] = [];
    const { data: activeGroups, error: groupsError } = await supabase
      .from('group_configs')
      .select('name, url')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (groupsError) {
      console.warn('[Scraper Trigger] Could not load groups from DB, falling back to env:', groupsError.message);
      // Fallback to env variable
      const envGroups = process.env.FACEBOOK_GROUPS?.split(',').filter(Boolean) || [];
      groupUrls = envGroups.map(u => u.trim());
    } else if (activeGroups && activeGroups.length > 0) {
      groupUrls = activeGroups.map(g => g.url);
      console.log('[Scraper Trigger] Loaded', activeGroups.length, 'active groups from database:');
      activeGroups.forEach(g => console.log('  -', g.name, ':', g.url));
    } else {
      // Fallback to env variable if no groups in DB
      const envGroups = process.env.FACEBOOK_GROUPS?.split(',').filter(Boolean) || [];
      groupUrls = envGroups.map(u => u.trim());
      console.log('[Scraper Trigger] No groups in DB, using env variable:', groupUrls);
    }

    if (groupUrls.length === 0) {
      return NextResponse.json(
        { error: 'No Facebook Groups configured. Add groups via /api/groups or set FACEBOOK_GROUPS env var.' },
        { status: 400 }
      );
    }

    // Facebook session cookie for private/closed group access
    // Format: "c_user=111; xs=abc; datr=xyz; fr=pqr"
    // Get this from your browser while logged in to Facebook (see dashboard instructions)
    const cookieString = process.env.FACEBOOK_COOKIE_STRING?.trim() || undefined;
    if (cookieString) {
      console.log('[Scraper Trigger] Facebook cookie configured — private groups will be accessible');
    } else {
      console.warn('[Scraper Trigger] No FACEBOOK_COOKIE_STRING set — only public groups will work');
    }

    // Prepare Actor input for facebook-groups-scraper
    // Documentation: https://apify.com/simpleapi/facebook-groups-scraper
    const actorInput: Record<string, unknown> = {
      // Facebook Groups to scrape (from DB or env)
      startUrls: groupUrls.map((url: string) => ({ url: url.trim() })),

      // CRITICAL: Limit the number of posts to avoid high costs
      resultsLimit: maxPosts,

      // Sort by chronological order (newest first)
      viewOption: "CHRONOLOGICAL",

      // Only fetch posts from the last 7 days to avoid stale leads
      onlyPostsNewerThan: process.env.SCRAPER_POSTS_NEWER_THAN || "7 days",
    };

    // Attach session cookie if available — required for private/closed groups
    if (cookieString) {
      actorInput.cookieString = cookieString;
    }

    console.log('[Scraper Trigger] Starting Apify Actor:', actorId);
    console.log('[Scraper Trigger] Input:', JSON.stringify(actorInput, null, 2));

    // Start the Actor with webhook configuration
    // Note: Cost limiting is done via Apify Console settings, not API
    const run = await client.actor(actorId).call(actorInput, {
      // Memory allocation (lower = cheaper)
      memory: 4096, // 4 GB
      
      // Timeout (prevents infinite runs)
      timeout: 18000, // 5 hours in seconds
      
      // Webhook configuration - Apify will POST to this URL when done
      webhooks: [
        {
          eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED'],
          // Append secret as query param so Apify can pass it without custom headers
          requestUrl: `${webhookUrl}?secret=${encodeURIComponent(process.env.WEBHOOK_SECRET || '')}`,
          payloadTemplate: JSON.stringify({
            runId: '{{resource.id}}',
            status: '{{resource.status}}',
            defaultDatasetId: '{{resource.defaultDatasetId}}',
            startedAt: '{{resource.startedAt}}',
            finishedAt: '{{resource.finishedAt}}',
          }),
        },
      ],
    });

    console.log('[Scraper Trigger] Actor started successfully');
    console.log('[Scraper Trigger] Run ID:', run.id);
    console.log('[Scraper Trigger] Status:', run.status);

    // Return immediately - don't wait for completion
    return NextResponse.json({
      success: true,
      message: 'Scraper started successfully',
      runId: run.id,
      status: run.status,
      webhookUrl: webhookUrl,
      groupsScraped: groupUrls.length,
      groups: groupUrls,
      cookieConfigured: !!cookieString,
      note: 'Results will be sent to webhook when scraping completes',
    });

  } catch (error) {
    console.error('[Scraper Trigger] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to start scraper',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for status check (auth required)
 */
export async function GET() {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();
  const apiToken = process.env.APIFY_API_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID;
  const webhookUrl = process.env.APIFY_WEBHOOK_URL;

  // Fetch active groups from DB
  const { data: activeGroups } = await supabase
    .from('group_configs')
    .select('name, url, is_active')
    .eq('is_active', true);

  return NextResponse.json({
    configured: !!(apiToken && actorId && webhookUrl),
    actorId: actorId || 'NOT_CONFIGURED',
    webhookUrl: webhookUrl || 'NOT_CONFIGURED',
    hasApiToken: !!apiToken,
    cookieConfigured: !!process.env.FACEBOOK_COOKIE_STRING,
    activeGroups: activeGroups || [],
    activeGroupCount: activeGroups?.length || 0,
  });
}
