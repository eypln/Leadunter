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
 * API Route: Trigger Apify Facebook Marketplace Scraper
 *
 * Mirrors /api/scraper/trigger but runs apify/facebook-marketplace-scraper
 * against the configured marketplace_search_configs URLs (property-rentals
 * category and/or search URLs) instead of Facebook Groups.
 *
 * The webhook URL carries `source=MARKETPLACE` so the shared webhook handler
 * knows to use the marketplace mapper/config table — Apify's ad-hoc webhook
 * payloadTemplate placeholders are unreliable (see /api/scraper/trigger),
 * so we can't rely on the payload body to distinguish actors.
 *
 * Usage:
 * - POST /api/scraper/trigger-marketplace
 * - Body: { maxListings?: number }
 *
 * Environment Variables Required:
 * - APIFY_API_TOKEN
 * - APIFY_MARKETPLACE_ACTOR_ID (defaults to "apify/facebook-marketplace-scraper")
 * - APIFY_WEBHOOK_URL
 */

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();

  try {
    const apiToken = process.env.APIFY_API_TOKEN;
    const actorId = process.env.APIFY_MARKETPLACE_ACTOR_ID || 'apify/facebook-marketplace-scraper';
    const webhookUrl = process.env.APIFY_WEBHOOK_URL;

    if (!apiToken) {
      return NextResponse.json({ error: 'APIFY_API_TOKEN not configured' }, { status: 500 });
    }
    if (!webhookUrl) {
      return NextResponse.json({ error: 'APIFY_WEBHOOK_URL not configured' }, { status: 500 });
    }

    const client = new ApifyClient({ token: apiToken });

    const body = await request.json().catch(() => ({}));
    const maxListings = body.maxListings || parseInt(process.env.MARKETPLACE_MAX_LISTINGS_PER_RUN || '50');

    // Fetch active marketplace search configs from database
    let searchUrls: string[] = [];
    const { data: activeConfigs, error: configError } = await supabase
      .from('marketplace_search_configs')
      .select('name, url')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (configError) {
      console.warn('[Marketplace Trigger] Could not load configs from DB, falling back to env:', configError.message);
      const envSearches = process.env.FACEBOOK_MARKETPLACE_SEARCHES?.split(',').filter(Boolean) || [];
      searchUrls = envSearches.map((u) => u.trim());
    } else if (activeConfigs && activeConfigs.length > 0) {
      searchUrls = activeConfigs.map((c) => c.url);
      console.log('[Marketplace Trigger] Loaded', activeConfigs.length, 'active searches from database:');
      activeConfigs.forEach((c) => console.log('  -', c.name, ':', c.url));
    } else {
      const envSearches = process.env.FACEBOOK_MARKETPLACE_SEARCHES?.split(',').filter(Boolean) || [];
      searchUrls = envSearches.map((u) => u.trim());
      console.log('[Marketplace Trigger] No configs in DB, using env variable:', searchUrls);
    }

    if (searchUrls.length === 0) {
      return NextResponse.json(
        {
          error:
            'No Marketplace searches configured. Add one via /api/marketplace-configs or set FACEBOOK_MARKETPLACE_SEARCHES env var.',
        },
        { status: 400 }
      );
    }

    // Prepare Actor input for apify/facebook-marketplace-scraper
    // includeListingDetails=true is required to get the listing description
    // text (needed for phone extraction + AI owner/agent classification).
    const actorInput: Record<string, unknown> = {
      startUrls: searchUrls.map((url: string) => ({ url: url.trim() })),
      resultsLimit: maxListings,
      includeListingDetails: true,
    };

    console.log('[Marketplace Trigger] Starting Apify Actor:', actorId);
    console.log('[Marketplace Trigger] Input:', JSON.stringify(actorInput, null, 2));

    const run = await client.actor(actorId).start(actorInput, {
      memory: 4096,
      timeout: 300,
      webhooks: [
        {
          eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED'],
          requestUrl: `${webhookUrl}?secret=${encodeURIComponent(process.env.WEBHOOK_SECRET || '')}&source=MARKETPLACE`,
        },
      ],
    });

    console.log('[Marketplace Trigger] Actor started successfully. Run ID:', run.id, 'Status:', run.status);

    return NextResponse.json({
      success: true,
      message: 'Marketplace scraper started successfully',
      runId: run.id,
      status: run.status,
      webhookUrl,
      searchesScraped: searchUrls.length,
      searches: searchUrls,
      note: 'Results will be sent to webhook when scraping completes',
    });
  } catch (error) {
    console.error('[Marketplace Trigger] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to start marketplace scraper',
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
  const actorId = process.env.APIFY_MARKETPLACE_ACTOR_ID || 'apify/facebook-marketplace-scraper';
  const webhookUrl = process.env.APIFY_WEBHOOK_URL;

  const { data: activeConfigs } = await supabase
    .from('marketplace_search_configs')
    .select('name, url, is_active')
    .eq('is_active', true);

  return NextResponse.json({
    configured: !!(apiToken && webhookUrl),
    actorId,
    webhookUrl: webhookUrl || 'NOT_CONFIGURED',
    hasApiToken: !!apiToken,
    activeSearches: activeConfigs || [],
    activeSearchCount: activeConfigs?.length || 0,
  });
}
