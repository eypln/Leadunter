import { NextRequest, NextResponse } from 'next/server';
import { leadRepository } from '@/lib/repositories/lead-repository';
import { geminiService } from '@/lib/ai/gemini-service';

export async function POST(request: NextRequest) {
  try {
    const { leadId } = await request.json();

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    // Fetch lead details
    const lead = await leadRepository.getLeadById(leadId);

    // Generate message based on lead type
    let message = '';

    if (lead.lead_type === 'OWNER') {
      // OWNER lead: AI-generated personalized message
      message = await geminiService.generateOwnerMessage({
        title: lead.title,
        description: lead.description,
        author_name: lead.author_name,
        location: lead.location,
        phone: lead.phone,
        price: lead.price,
      });
    } else {
      // CLIENT lead: AI-generated short comment
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
