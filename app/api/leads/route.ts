import { NextRequest, NextResponse } from 'next/server';
import { leadRepository } from '@/lib/repositories/lead-repository';
import type { LeadType, LeadStatus } from '@/lib/supabase/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters = {
      leadType: searchParams.get('type') as LeadType | undefined,
      status: searchParams.get('status') as LeadStatus | undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const leads = await leadRepository.getLeads(filters);

    return NextResponse.json({
      success: true,
      data: leads,
      count: leads.length
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch leads'
      },
      { status: 500 }
    );
  }
}
