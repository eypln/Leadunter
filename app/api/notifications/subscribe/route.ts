import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/notifications/subscribe
 * Save a Web Push subscription for the authenticated user
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const sub = body as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: session.user.id,
      endpoint: sub.endpoint,
      keys: sub.keys,
    },
    { onConflict: 'endpoint' }
  );

  if (error) {
    console.error('[Subscribe] DB error:', error);
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/**
 * DELETE /api/notifications/subscribe
 * Remove the caller's push subscription
 */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { endpoint } = body as { endpoint?: string };
  if (!endpoint) {
    return NextResponse.json({ error: 'endpoint required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', session.user.id)
    .eq('endpoint', endpoint);

  if (error) {
    console.error('[Unsubscribe] DB error:', error);
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
