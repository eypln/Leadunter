import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();
  try {
    const searchParams = request.nextUrl.searchParams;
    const leadType = searchParams.get('type'); // OWNER | CLIENT | null (all)

    // 1. Leads per day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let leadsQuery = supabaseAdmin
      .from('leads')
      .select('created_at, status, lead_type, location, intent_score')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (leadType) {
      leadsQuery = leadsQuery.eq('lead_type', leadType);
    }

    const { data: allLeads, error: leadsError } = await leadsQuery;
    if (leadsError) throw new Error(leadsError.message);

    // 2. Build daily volume
    const volumeMap: Record<string, number> = {};
    allLeads?.forEach((lead) => {
      const day = lead.created_at.slice(0, 10); // YYYY-MM-DD
      volumeMap[day] = (volumeMap[day] ?? 0) + 1;
    });
    const volumeData = Object.entries(volumeMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // 3. Response rate
    const total = allLeads?.length ?? 0;
    const responded = allLeads?.filter((l) => l.status === 'RESPONDED').length ?? 0;
    const interested = allLeads?.filter((l) => l.status === 'INTERESTED').length ?? 0;
    const skipped = allLeads?.filter((l) => l.status === 'SKIPPED').length ?? 0;
    const responseRate = total > 0 ? Math.round(((responded + interested) / total) * 100) : 0;

    // 4. Top locations (top 5)
    const locationMap: Record<string, number> = {};
    allLeads?.forEach((lead) => {
      if (lead.location) {
        const loc = lead.location.trim();
        locationMap[loc] = (locationMap[loc] ?? 0) + 1;
      }
    });
    const topLocations = Object.entries(locationMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));

    // 5. Average intent score (OWNER leads only)
    const ownerLeadsWithScore = allLeads?.filter(
      (l) => l.lead_type === 'OWNER' && l.intent_score != null
    );
    const avgIntentScore =
      ownerLeadsWithScore && ownerLeadsWithScore.length > 0
        ? Math.round(
            ownerLeadsWithScore.reduce((sum, l) => sum + (l.intent_score ?? 0), 0) /
              ownerLeadsWithScore.length
          )
        : null;

    return NextResponse.json({
      success: true,
      data: {
        total,
        responded,
        interested,
        skipped,
        responseRate,
        avgIntentScore,
        volumeData,
        topLocations,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics',
      },
      { status: 500 }
    );
  }
}
