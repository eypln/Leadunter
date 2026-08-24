import { NextRequest, NextResponse } from 'next/server';
import { leadRepository } from '@/lib/repositories/lead-repository';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';
import type { LeadType } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();
  try {
    const searchParams = request.nextUrl.searchParams;
    const leadType = searchParams.get('type') as LeadType | undefined;

    const stats = await leadRepository.getLeadStats(leadType);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats'
      },
      { status: 500 }
    );
  }
}
