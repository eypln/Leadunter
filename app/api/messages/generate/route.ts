import { NextRequest, NextResponse } from 'next/server';
import { leadRepository } from '@/lib/repositories/lead-repository';

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
      // OWNER lead message templates
      if (lead.phone) {
        // Template A: WhatsApp (Phone found)
        message = `Hi ${lead.author_name},

I hope you're doing well! I'm Erhan, a letting specialist at QL Prime. My team and I specialize in helping landlords like you to find reliable, long-term tenants quickly and ensure a hassle-free letting process.

I came across your property listing in ${lead.location || 'Malta'} and would love to discuss how we can help you find the perfect tenant.

If you're interested in our service, we'd be happy to answer any questions.

Looking forward to working together.
Best regards`;
      } else {
        // Template B: Messenger (No phone)
        message = `Hi ${lead.author_name},

I hope you're doing well! I'm an agent at Quicklets.

My team and I specialize in helping landlords like you to find reliable, long-term tenants quickly and ensure a hassle-free letting process.

If you're interested in our service, we'd be happy to answer any questions via WhatsApp +35699690055.

Looking forward to working together.
Best regards`;
      }
    } else {
      // CLIENT lead message template
      message = 'Contact for options';
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
