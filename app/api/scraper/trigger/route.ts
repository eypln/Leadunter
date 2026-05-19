import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

/**
 * API Route: Trigger Apify Scraper
 * 
 * This endpoint starts an Apify Actor to scrape Facebook for leads.
 * It uses a webhook architecture to avoid Vercel timeout issues:
 * 1. Start the Apify Actor with webhook configuration
 * 2. Return immediately (no waiting for completion)
 * 3. Apify will call our webhook when done
 * 
 * Usage:
 * - POST /api/scraper/trigger
 * - Can be called manually or via cron job
 * 
 * Environment Variables Required:
 * - APIFY_API_TOKEN: Your Apify API token
 * - APIFY_ACTOR_ID: The Apify Actor to run (e.g., "apify/facebook-pages-scraper")
 * - APIFY_WEBHOOK_URL: Your webhook URL (e.g., "https://your-domain.vercel.app/api/webhooks/apify")
 */

export async function POST(request: NextRequest) {
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
    const facebookGroups = body.facebookGroups || process.env.FACEBOOK_GROUPS?.split(',') || [];
    const marketplaceUrl = body.marketplaceUrl || process.env.FACEBOOK_MARKETPLACE_URL;

    // Prepare Actor input for facebook-groups-scraper
    // Documentation: https://apify.com/apify/facebook-groups-scraper
    const actorInput = {
      // Facebook Groups to scrape
      startUrls: facebookGroups.map((url: string) => ({ url: url.trim() })),
      
      // CRITICAL: Limit the number of posts to avoid high costs
      resultsLimit: maxPosts, // This is the correct field name for this Actor
      
      // Sort by chronological order (newest first)
      visualOption: "CHRONOLOGICAL",
    };

    // Run options to limit cost
    const runOptions = {
      maxCostUsd: 0.5, // Maximum $0.50 per run
      timeoutSecs: 18000, // 5 hours timeout
      memoryMbytes: 4096, // 4 GB memory
    };

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
          requestUrl: webhookUrl,
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
 * GET endpoint for testing/status check
 */
export async function GET() {
  const apiToken = process.env.APIFY_API_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID;
  const webhookUrl = process.env.APIFY_WEBHOOK_URL;

  return NextResponse.json({
    configured: !!(apiToken && actorId && webhookUrl),
    actorId: actorId || 'NOT_CONFIGURED',
    webhookUrl: webhookUrl || 'NOT_CONFIGURED',
    hasApiToken: !!apiToken,
  });
}
