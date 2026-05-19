import webpush from 'web-push';

// Configure web-push with VAPID keys
// Generate keys with: npx web-push generate-vapid-keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@leadhunter.app';

let webpushConfigured = false;

function ensureConfigured() {
  if (webpushConfigured) return;
  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error(
      'VAPID keys not configured. Run: npx web-push generate-vapid-keys\n' +
        'Then add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and NEXT_PUBLIC_VAPID_PUBLIC_KEY to .env.local'
    );
  }
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  webpushConfigured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Send a push notification to a single subscriber
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<boolean> {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload)
    );
    return true;
  } catch (err: any) {
    // 410 Gone = subscription expired/unsubscribed
    if (err.statusCode === 410 || err.statusCode === 404) {
      return false; // Signal caller to delete this subscription
    }
    console.error('[Push] Failed to send notification:', err);
    throw err;
  }
}

/**
 * Send a push notification to multiple subscribers
 * Returns array of expired endpoint URLs (to be removed from DB)
 */
export async function sendPushToAll(
  subscriptions: (PushSubscriptionData & { endpoint: string })[],
  payload: PushPayload
): Promise<string[]> {
  const expiredEndpoints: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const active = await sendPushNotification(sub, payload);
      if (!active) {
        expiredEndpoints.push(sub.endpoint);
      }
    })
  );

  return expiredEndpoints;
}
