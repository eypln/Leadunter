/**
 * Admin: Recover leads from an existing Apify run
 *
 * GET  /api/admin/recover-run?runId=B0HUjwBVKy3E6ISVM  → dry-run, shows what would be inserted
 * POST /api/admin/recover-run  body: { runId: "...", dryRun?: false }  → actually inserts
 *
 * Uses the same processing pipeline as the webhook handler.
 * Delete this file after use.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';
import { createClient } from '@supabase/supabase-js';
import { geminiService } from '@/lib/ai/gemini-service';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── helpers (same logic as webhook) ─────────────────────────────────────────

function extractPhoneNumber(text: string): string | null {
  if (!text) return null;
  const patterns = [
    /\+?\d{1,4}[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}/g,
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
    /\d{2,4}[\s-]?\d{6,8}/g,
  ];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches?.length) return matches[0].replace(/[\s-]/g, '');
  }
  return null;
}

function detectScrapeSource(
  facebookUrl: string,
  groupConfigs: Array<{ name: string; url: string }>
): string {
  if (!facebookUrl) return 'UNKNOWN';
  if (facebookUrl.includes('/marketplace/')) return 'FACEBOOK_MARKETPLACE';
  if (facebookUrl.includes('/groups/')) {
    for (const group of groupConfigs) {
      const groupId = group.url.split('/groups/')[1]?.replace(/\/$/, '');
      if (groupId && facebookUrl.includes(groupId)) return `FACEBOOK_GROUP:${group.name}`;
    }
    const m = facebookUrl.match(/\/groups\/([^/?#]+)/);
    return m ? `FACEBOOK_GROUP:${m[1]}` : 'FACEBOOK_GROUP:Unknown';
  }
  return 'UNKNOWN';
}

type ApifyItem = Record<string, unknown>;
type GroupConfig = { name: string; url: string };

async function processItem(item: ApifyItem, groups: GroupConfig[]) {
  const text = (item.text as string) || '';
  const user = item.user as Record<string, unknown> | undefined;
  const authorName = (user?.name as string) || 'Unknown';
  const authorId = (user?.id as string) || null;
  const facebookUrl = (item.facebookUrl as string) || (item.postUrl as string) || '';

  const title = text.substring(0, 200) || 'No title';
  let price: number | null = null;
  let location: string | null = null;
  let description = text;

  const attachments = (item.attachments as ApifyItem[]) || [];
  if (attachments.length > 0) {
    const first = attachments[0];
    const properties = first.properties as Array<{ key: string; value?: { text?: string } }> | undefined;
    if (Array.isArray(properties)) {
      for (const prop of properties) {
        if (prop.key === 'price_amount' && prop.value?.text) {
          const amt = parseInt(prop.value.text);
          if (!isNaN(amt)) price = Math.round(amt / 100);
        }
        if (prop.key === 'pickup_note' && prop.value?.text) location = prop.value.text;
        if (prop.key === 'description' && prop.value?.text) description = prop.value.text;
      }
    }
  }

  const imageUrls: string[] = [];
  for (const att of attachments) {
    if (att.thumbnail) imageUrls.push(att.thumbnail as string);
    else if ((att.image as Record<string, unknown>)?.uri) {
      imageUrls.push(((att.image as Record<string, unknown>).uri) as string);
    }
  }

  const phone = extractPhoneNumber(description || text);
  const postUrl = facebookUrl || `https://www.facebook.com/groups/post/${Date.now()}_${Math.random()}`;
  const scrapeSource = detectScrapeSource(facebookUrl, groups);

  // AI analysis
  let leadType: 'OWNER' | 'CLIENT' = 'OWNER';
  let intentScore: number | null = null;
  let isAgent = false;

  try {
    leadType = await geminiService.classifyLeadType({ title, description });
    if (leadType === 'OWNER') {
      [intentScore, isAgent] = await Promise.all([
        geminiService.analyzeIntentScore({ title, description, author_name: authorName }),
        geminiService.detectAgent({ title, description, author_name: authorName }),
      ]);
    }
  } catch (e) {
    console.error('[Recovery] AI error:', e);
  }

  if (leadType === 'OWNER' && intentScore === null) intentScore = 5;

  return {
    post_url: postUrl,
    title,
    description,
    author_name: authorName,
    author_id: authorId,
    location,
    phone,
    price,
    image_urls: imageUrls,
    images_downloaded: false,
    status: 'NEW',
    scrape_source: scrapeSource,
    lead_type: leadType,
    intent_score: intentScore,
    is_agent: isAgent,
    created_at: new Date().toISOString(),
  };
}

async function leadExists(postUrl: string): Promise<boolean> {
  const { data } = await supabase.from('leads').select('id').eq('post_url', postUrl).maybeSingle();
  return !!data;
}

// ─── GET: dry-run preview ────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();

  const runId = request.nextUrl.searchParams.get('runId');
  if (!runId) {
    return NextResponse.json({ error: 'runId query param required' }, { status: 400 });
  }

  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) return NextResponse.json({ error: 'APIFY_API_TOKEN not set' }, { status: 500 });

  const client = new ApifyClient({ token: apiToken });

  try {
    const run = await client.run(runId).get();
    if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // Quick duplicate check
    const newItems: string[] = [];
    const dupItems: string[] = [];
    for (const item of items) {
      const url = ((item.facebookUrl as string) || (item.postUrl as string) || '');
      if (url && await leadExists(url)) dupItems.push(url);
      else newItems.push(url || '(no url)');
    }

    return NextResponse.json({
      runId,
      status: run.status,
      datasetId: run.defaultDatasetId,
      totalItems: items.length,
      wouldInsert: newItems.length,
      wouldSkip: dupItems.length,
      preview: items.slice(0, 3).map(i => ({
        text: (i.text as string)?.substring(0, 100),
        url: (i.facebookUrl as string) || (i.postUrl as string),
        user: (i.user as Record<string, unknown>)?.name,
      })),
      instruction: 'POST to /api/admin/recover-run with { runId } to import these leads',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// ─── POST: actually import ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();

  const body = await request.json().catch(() => ({}));
  const { runId, dryRun = false } = body as { runId?: string; dryRun?: boolean };

  if (!runId) return NextResponse.json({ error: 'runId required in body' }, { status: 400 });

  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) return NextResponse.json({ error: 'APIFY_API_TOKEN not set' }, { status: 500 });

  const client = new ApifyClient({ token: apiToken });

  try {
    const run = await client.run(runId).get();
    if (!run) return NextResponse.json({ error: 'Run not found on Apify' }, { status: 404 });

    console.log(`[Recovery] Fetching dataset ${run.defaultDatasetId} for run ${runId}`);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`[Recovery] ${items.length} items in dataset`);

    // Load group configs
    const { data: groupConfigs } = await supabase.from('group_configs').select('name, url');
    const groups = groupConfigs || [];

    let inserted = 0;
    let duplicates = 0;
    let errors = 0;
    const results: Array<{ title: string; status: string; leadType?: string; error?: string }> = [];

    for (const item of items) {
      try {
        const lead = await processItem(item as ApifyItem, groups as GroupConfig[]);

        const exists = await leadExists(lead.post_url);
        if (exists) {
          duplicates++;
          results.push({ title: lead.title.substring(0, 60), status: 'duplicate' });
          continue;
        }

        if (!dryRun) {
          const { error } = await supabase.from('leads').insert(lead);
          if (error) throw error;
        }

        inserted++;
        results.push({
          title: lead.title.substring(0, 60),
          status: dryRun ? 'would-insert' : 'inserted',
          leadType: lead.lead_type,
        });
        console.log(`[Recovery] ${dryRun ? '[DRY]' : '✅'} "${lead.title.substring(0, 50)}" (${lead.lead_type})`);
      } catch (err) {
        errors++;
        results.push({
          title: 'error',
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        });
        console.error('[Recovery] Error processing item:', err);
      }
    }

    console.log(`[Recovery] Done — inserted:${inserted} duplicates:${duplicates} errors:${errors}`);

    return NextResponse.json({
      success: true,
      dryRun,
      runId,
      totalItems: items.length,
      inserted,
      duplicates,
      errors,
      results,
    });
  } catch (err) {
    console.error('[Recovery] Fatal error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
