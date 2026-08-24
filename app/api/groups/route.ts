import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/groups
 * List all Facebook group configurations
 */
export async function GET() {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();
  try {
    const { data, error } = await supabase
      .from('group_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ groups: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch groups', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/groups
 * Add a new Facebook group to monitor
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

    // Validate Facebook URL format (groups or share links)
    const fbGroupPattern = /^https:\/\/www\.facebook\.com\/(groups\/[\w.-]+|share\/g\/[\w.-]+)\/?$/;
    if (!fbGroupPattern.test(url)) {
      return NextResponse.json(
        { error: 'Invalid Facebook Group URL. Format: https://www.facebook.com/groups/ID or https://www.facebook.com/share/g/ID' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('group_configs')
      .insert({ name: name.trim(), url: url.trim(), is_active: true })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This Facebook Group URL is already configured' },
          { status: 409 }
        );
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ group: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create group', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
