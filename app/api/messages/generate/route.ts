import { NextRequest, NextResponse } from 'next/server';
import { leadRepository } from '@/lib/repositories/lead-repository';
import { geminiService } from '@/lib/ai/gemini-service';
import { requireAuth, unauthorizedResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorizedResponse();
  let body: { leadId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }

  const { leadId } = body;

  if (!leadId) {
    return NextResponse.json(
      { success: false, error: 'Lead ID is required' },
      { status: 400 }
    );
  }

  if (!UUID_REGEX.test(leadId)) {
    return NextResponse.json(
      { success: false, error: 'Invalid lead ID format' },
      { status: 400 }
    );
  }

  try {
    // Fetch lead details
    const lead = await leadRepository.getLeadById(leadId);

    // Generate message based on lead type
    let message = '';

    if (lead.lead_type === 'OWNER') {
      message = await geminiService.generateOwnerMessage({
        title: lead.title,
        description: lead.description,
        author_name: lead.author_name,
        location: lead.location,
        phone: lead.phone,
        price: lead.price,
      });
    } else {
      message = await geminiService.generateClientMessage({
        title: lead.title,
        description: lead.description,
        author_name: lead.author_name,
        location: lead.location,
        price: lead.price,
      });
    }

    return NextResponse.json({
      success: true,
      message,
      leadType: lead.lead_type,
      hasPhone: !!lead.phone,
    });
  } catch (error) {
    console.error('Error generating message:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to generate message',
      },
      { status: 500 }
    );
  }
}
