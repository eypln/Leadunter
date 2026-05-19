/**
 * Email Notification Service
 * Sends email notifications for scraper job status using Resend
 */

import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export interface ScraperJobNotification {
  jobId: string;
  status: 'success' | 'failure';
  leadsFound: number;
  ownerLeads?: number;
  clientLeads?: number;
  agentsDetected?: number;
  startedAt: Date;
  completedAt: Date;
  duration: number; // in seconds
  errorMessage?: string;
  source: string; // 'MARKETPLACE' or 'GROUPS'
}

/**
 * Send email notification for scraper job completion
 */
export async function sendScraperJobNotification(
  notification: ScraperJobNotification
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'triquaestate@gmail.com';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    // Build email subject
    const subject = notification.status === 'success'
      ? `✅ Scraper Job Completed - ${notification.leadsFound} leads found`
      : `❌ Scraper Job Failed - ${notification.errorMessage}`;

    // Build email HTML content
    const html = buildEmailHTML(notification);

    // Send email via Resend
    const { data, error } = await getResend().emails.send({
      from: fromEmail,
      to: adminEmail,
      subject,
      html,
    });

    if (error) {
      console.error('❌ Failed to send email notification:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email notification sent successfully:', data?.id);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending email notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Build HTML email content
 */
function buildEmailHTML(notification: ScraperJobNotification): string {
  const statusEmoji = notification.status === 'success' ? '✅' : '❌';
  const statusColor = notification.status === 'success' ? '#10b981' : '#ef4444';
  const statusText = notification.status === 'success' ? 'SUCCESS' : 'FAILED';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scraper Job Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; color: #e2e8f0;">
  <div style="max-width: 600px; margin: 40px auto; background: linear-gradient(to bottom, #1e293b, #0f172a); border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: white;">
        ${statusEmoji} Lead Hunter
      </h1>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9);">
        Scraper Job Notification
      </p>
    </div>

    <!-- Status Badge -->
    <div style="padding: 24px; text-align: center;">
      <div style="display: inline-block; background-color: ${statusColor}; color: white; padding: 8px 24px; border-radius: 20px; font-weight: 600; font-size: 14px;">
        ${statusText}
      </div>
    </div>

    <!-- Job Details -->
    <div style="padding: 0 24px 24px 24px;">
      <div style="background-color: #1e293b; border-radius: 8px; padding: 20px; border: 1px solid #334155;">
        
        <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #f1f5f9;">
          Job Details
        </h2>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Job ID:</td>
            <td style="padding: 8px 0; color: #f1f5f9; font-size: 14px; text-align: right; font-family: monospace;">
              ${notification.jobId}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Source:</td>
            <td style="padding: 8px 0; color: #f1f5f9; font-size: 14px; text-align: right;">
              ${notification.source}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Started:</td>
            <td style="padding: 8px 0; color: #f1f5f9; font-size: 14px; text-align: right;">
              ${formatDate(notification.startedAt)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Completed:</td>
            <td style="padding: 8px 0; color: #f1f5f9; font-size: 14px; text-align: right;">
              ${formatDate(notification.completedAt)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Duration:</td>
            <td style="padding: 8px 0; color: #f1f5f9; font-size: 14px; text-align: right;">
              ${formatDuration(notification.duration)}
            </td>
          </tr>
        </table>
      </div>

      ${notification.status === 'success' ? `
      <!-- Results -->
      <div style="background-color: #1e293b; border-radius: 8px; padding: 20px; border: 1px solid #334155; margin-top: 16px;">
        <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #f1f5f9;">
          Results
        </h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <!-- Total Leads -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: white;">
              ${notification.leadsFound}
            </div>
            <div style="font-size: 12px; color: rgba(255, 255, 255, 0.9); margin-top: 4px;">
              Total Leads
            </div>
          </div>

          <!-- Owner Leads -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: white;">
              ${notification.ownerLeads || 0}
            </div>
            <div style="font-size: 12px; color: rgba(255, 255, 255, 0.9); margin-top: 4px;">
              Owner Leads
            </div>
          </div>

          <!-- Client Leads -->
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: white;">
              ${notification.clientLeads || 0}
            </div>
            <div style="font-size: 12px; color: rgba(255, 255, 255, 0.9); margin-top: 4px;">
              Client Leads
            </div>
          </div>

          <!-- Agents Detected -->
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: white;">
              ${notification.agentsDetected || 0}
            </div>
            <div style="font-size: 12px; color: rgba(255, 255, 255, 0.9); margin-top: 4px;">
              Agents Filtered
            </div>
          </div>
        </div>
      </div>
      ` : `
      <!-- Error Message -->
      <div style="background-color: #1e293b; border-radius: 8px; padding: 20px; border: 1px solid #ef4444; margin-top: 16px;">
        <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #ef4444;">
          Error Details
        </h2>
        <p style="margin: 0; color: #f1f5f9; font-size: 14px; font-family: monospace; background-color: #0f172a; padding: 12px; border-radius: 4px;">
          ${notification.errorMessage || 'Unknown error occurred'}
        </p>
      </div>
      `}
    </div>

    <!-- Footer -->
    <div style="padding: 24px; text-align: center; border-top: 1px solid #334155;">
      <p style="margin: 0; color: #64748b; font-size: 12px;">
        Lead Hunter - Real Estate Lead Generation System
      </p>
      <p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px;">
        This is an automated notification. Do not reply to this email.
      </p>
    </div>

  </div>
</body>
</html>
  `;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/**
 * Format duration in seconds to human-readable format
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
