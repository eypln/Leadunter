/**
 * Shared authentication helpers for API routes.
 *
 * Usage:
 *   import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
 *
 *   export async function GET(request: NextRequest) {
 *     const session = await requireAuth();
 *     if (!session) return unauthorizedResponse();
 *     // ... rest of handler
 *   }
 */

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

/**
 * Returns the current session if authenticated, null otherwise.
 * Drop-in replacement for `getServerSession(authOptions)` with a null guard.
 */
export async function requireAuth(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return session;
}

/** Standard 401 response */
export function unauthorizedResponse() {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

/**
 * Validates the webhook secret sent by Apify (or internal callers).
 * Checks the `x-apify-webhook-secret` header, Authorization header,
 * or a `secret` query parameter (used by Apify which doesn't support custom headers).
 *
 * Returns true if the caller is authorised.
 */
export function validateWebhookSecret(request: Request): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    // If no secret is configured, skip validation (dev mode)
    console.warn('[WebhookAuth] WEBHOOK_SECRET not set — skipping validation');
    return true;
  }

  // Check dedicated webhook header first
  const headerSecret = request.headers.get('x-apify-webhook-secret');
  if (headerSecret === secret) return true;

  // Fallback: Bearer token in Authorization header (used by internal callers)
  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${secret}`) return true;

  // Fallback: query param (Apify appends this to the webhook URL)
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');
  if (querySecret === secret) return true;

  return false;
}
