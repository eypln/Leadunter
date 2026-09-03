import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase/client';
import type { MessageTemplateType } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

const VALID_TEMPLATE_TYPES: MessageTemplateType[] = ['WHATSAPP', 'MESSENGER', 'FACEBOOK_COMMENT'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET() {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();

  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('id, template_type, message_text, sent_at, created_at, leads(title, author_name, lead_type, post_url)')
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch message history' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();

  let body: { leadId?: string; templateType?: MessageTemplateType; messageText?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.leadId || !UUID_REGEX.test(body.leadId) || !body.messageText?.trim() || !body.templateType || !VALID_TEMPLATE_TYPES.includes(body.templateType)) {
    return NextResponse.json({ success: false, error: 'Invalid message details' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('messages').insert({
    lead_id: body.leadId,
    template_type: body.templateType,
    message_text: body.messageText.trim(),
    sent_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Error recording sent message:', error);
    return NextResponse.json({ success: false, error: 'Failed to record message' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}