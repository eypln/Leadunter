import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { sendPushToAll, type PushPayload, type PushSubscriptionData } from '@/lib/pwa/push-notifications';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/notifications/push
 * Send a push notification to all subscribed users.
 * Used internally by the webhook handler after new leads are found.
 *
 * Body: { title: string; body: string; tag?: string; url?: string }
 * Caller must provide the internal WEBHOOK_SECRET as Authorization header.
 */
export async function POST(request: NextRequest) {
  // Allow either an authenticated user session OR the internal webhook secret
  const authHeader = request.headers.get('authorization');
  const webhookSecret = process.env.WEBHOOK_SECRET;
  const isInternalCall = webhookSecret && authHeader === `Bearer ${webhookSecret}`;

  if (!isInternalCall) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let payload: PushPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!payload.title || !payload.body) {
    return NextResponse.json({ error: 'title and body required' }, { status: 400 });
  }

  // Fetch all active subscriptions
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, keys');

  if (error) {
    console.error('[Push API] Failed to fetch subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: true, sent: 0, message: 'No subscribers' });
  }

  // Send notifications; collect expired endpoints
  let expiredEndpoints: string[] = [];
  try {
    expiredEndpoints = await sendPushToAll(
      subscriptions as (PushSubscriptionData & { endpoint: string })[],
      payload
    );
  } catch (err: any) {
    // If VAPID keys are not configured, return 503 gracefully
    if (err.message?.includes('VAPID keys not configured')) {
      return NextResponse.json(
        { success: false, message: 'Push notifications not configured (missing VAPID keys)' },
        { status: 503 }
      );
    }
    throw err;
  }

  // Clean up expired subscriptions
  if (expiredEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', expiredEndpoints);
    console.log('[Push API] Removed', expiredEndpoints.length, 'expired subscriptions');
  }

  const sent = subscriptions.length - expiredEndpoints.length;
  console.log(`[Push API] Sent ${sent}/${subscriptions.length} notifications`);

  return NextResponse.json({ success: true, sent, expired: expiredEndpoints.length });
}
