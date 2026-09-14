import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { MARKETPLACE_URL_PATTERN } from '@/lib/scraper/marketplace-query';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/marketplace-configs
 * List all Facebook Marketplace search configurations
 */
export async function GET() {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();
  try {
    const { data, error } = await supabase
      .from('marketplace_search_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ configs: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch marketplace configs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketplace-configs
 * Add a new Facebook Marketplace search/category URL to monitor
 */
export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();
  try {
    const body = await request.json();
    const { name, url } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: 'name and url are required' },
        { status: 400 }
      );
    }

    if (!MARKETPLACE_URL_PATTERN.test(url)) {
      return NextResponse.json(
        {
          error:
            'Invalid Facebook Marketplace URL. Use a location, category (e.g. propertyrentals), or search URL, e.g. https://www.facebook.com/marketplace/malta/propertyrentals',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('marketplace_search_configs')
      .insert({
        name: name.trim(),
        url: url.trim(),
        is_active: true,
        owner_only: body.ownerOnly ?? false,
        exclude_agents: body.excludeAgents ?? true,
        minimum_intent_score: body.minimumIntentScore ?? 7,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This Marketplace URL is already configured' },
          { status: 409 }
        );
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ config: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create marketplace config', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
