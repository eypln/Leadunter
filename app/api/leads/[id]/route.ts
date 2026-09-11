import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { leadRepository } from '@/lib/repositories/lead-repository';
import { geminiService } from '@/lib/ai/gemini-service';
import { hasStrongAgencySignal } from '@/lib/scraper/lead-filter';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import type { LeadStatus } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

const VALID_STATUSES: LeadStatus[] = ['NEW', 'RESPONDED', 'SKIPPED', 'INTERESTED'];
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();

  if (!UUID_REGEX.test(params.id)) {
    return NextResponse.json({ success: false, error: 'Invalid lead ID' }, { status: 400 });
  }

  try {
    const lead = await leadRepository.getLeadById(params.id);

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch lead',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();

  if (!UUID_REGEX.test(params.id)) {
    return NextResponse.json({ success: false, error: 'Invalid lead ID' }, { status: 400 });
  }

  let body: { status?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { status, action } = body;

  try {
    // Re-run AI analysis for a lead
    if (action === 'analyze') {
      const lead = await leadRepository.getLeadById(params.id);

      if (lead.lead_type !== 'OWNER') {
        return NextResponse.json(
          { success: false, error: 'AI analysis is only available for OWNER leads' },
          { status: 400 }
        );
      }

      const intentScore = await geminiService.analyzeIntentScore({
        title: lead.title,
        description: lead.description,
        author_name: lead.author_name,
      });
      const agentDecision = hasStrongAgencySignal(
        `${lead.title} ${lead.description} ${lead.author_name}`
      )
        ? 'AGENT'
        : await geminiService.detectAgent({
            title: lead.title,
            description: lead.description,
            author_name: lead.author_name,
          });
      const isAgent = agentDecision === 'AGENT';

      const { data, error } = await supabase
        .from('leads')
        .update({ intent_score: intentScore, is_agent: isAgent })
        .eq('id', params.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, data });
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status as LeadStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const lead = await leadRepository.updateLeadStatus(
      params.id,
      status as LeadStatus
    );

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update lead',
      },
      { status: 500 }
    );
  }
}
