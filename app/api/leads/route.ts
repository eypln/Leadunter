import { NextRequest, NextResponse } from 'next/server';
import { leadRepository } from '@/lib/repositories/lead-repository';
import type { LeadType, LeadStatus } from '@/lib/supabase/types';

const VALID_LEAD_TYPES: LeadType[] = ['OWNER', 'CLIENT'];
const VALID_STATUSES: LeadStatus[] = ['NEW', 'RESPONDED', 'SKIPPED', 'INTERESTED'];
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const typeParam = searchParams.get('type');
    const statusParam = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Validate type
    if (typeParam && !VALID_LEAD_TYPES.includes(typeParam as LeadType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid lead type' },
        { status: 400 }
      );
    }

    // Validate status
    if (statusParam && !VALID_STATUSES.includes(statusParam as LeadStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status filter' },
        { status: 400 }
      );
    }

    const limit = limitParam ? Math.min(parseInt(limitParam, 10), MAX_LIMIT) : 50;
    const offset = offsetParam ? Math.max(parseInt(offsetParam, 10), 0) : 0;

    if (isNaN(limit) || isNaN(offset)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const filters = {
      leadType: typeParam as LeadType | undefined,
      status: statusParam as LeadStatus | undefined,
      scrapeSource: searchParams.get('source') || undefined,
      limit,
      offset,
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
