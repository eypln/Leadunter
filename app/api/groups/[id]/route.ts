import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * PATCH /api/groups/[id]
 * Update a group config (toggle active status or rename)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();
  try {
    const body = await request.json();
    const allowedFields = [
      'name',
      'is_active',
      'owner_only',
      'exclude_agents',
      'minimum_intent_score',
    ];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if ('minimum_intent_score' in updates) {
      const score = Number(updates.minimum_intent_score);
      if (!Number.isInteger(score) || score < 0 || score > 10) {
        return NextResponse.json(
          { error: 'minimum_intent_score must be an integer from 0 to 10' },
          { status: 400 }
        );
      }
      updates.minimum_intent_score = score;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update. Allowed: name, is_active' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('group_configs')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ group: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update group', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/groups/[id]
 * Remove a group configuration
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();
  try {
    const { error } = await supabase
      .from('group_configs')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete group', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
