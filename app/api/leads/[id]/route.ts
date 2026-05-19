import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { leadRepository } from '@/lib/repositories/lead-repository';
import { geminiService } from '@/lib/ai/gemini-service';
import type { LeadStatus } from '@/lib/supabase/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
  try {
    const body = await request.json();
    const { status, action } = body;

    // Re-run AI analysis for a lead
    if (action === 'analyze') {
      const lead = await leadRepository.getLeadById(params.id);

      if (lead.lead_type !== 'OWNER') {
        return NextResponse.json(
          { success: false, error: 'AI analysis is only available for OWNER leads' },
          { status: 400 }
        );
      }

      const [intentScore, isAgent] = await Promise.all([
        geminiService.analyzeIntentScore({
          title: lead.title,
          description: lead.description,
          author_name: lead.author_name,
        }),
        geminiService.detectAgent({
          title: lead.title,
          description: lead.description,
          author_name: lead.author_name,
        }),
      ]);

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
