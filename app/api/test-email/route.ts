import { NextResponse } from 'next/server';
import { sendScraperJobNotification } from '@/lib/notifications/email-service';

/**
 * Test endpoint to verify email notifications are working
 */
export async function GET() {
  try {
    console.log('[Test Email] Sending test notification...');
    
    const result = await sendScraperJobNotification({
      jobId: 'test_' + Date.now(),
      status: 'success',
      leadsFound: 15,
      ownerLeads: 10,
      clientLeads: 5,
      agentsDetected: 3,
      startedAt: new Date(Date.now() - 180000), // 3 minutes ago
      completedAt: new Date(),
      duration: 180, // 3 minutes
      source: 'TEST',
    });

    if (result.success) {
      console.log('[Test Email] ✅ Email sent successfully!');
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully! Check triquaestate@gmail.com',
      });
    } else {
      console.error('[Test Email] ❌ Failed to send email:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'Failed to send test email',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Test Email] ❌ Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to send test email',
    }, { status: 500 });
  }
}
