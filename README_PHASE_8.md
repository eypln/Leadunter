# 🤖 Phase 8: Automated Scraper with Email Notifications

## Overview

Phase 8 transforms Lead Hunter into a fully automated lead generation system. The scraper now runs automatically every 6 hours and sends beautiful email notifications with detailed statistics to **triquaestate@gmail.com**.

---

## 🎯 What's New

### ✅ Automated Scraping
- **Schedule**: Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
- **Platform**: Vercel Cron Jobs (free, built-in)
- **Zero Maintenance**: Runs automatically, no manual intervention

### ✅ Email Notifications
- **Service**: Resend (free tier, 3,000 emails/month)
- **Design**: Premium dark theme matching dashboard
- **Content**: Detailed job statistics and results
- **Recipient**: triquaestate@gmail.com

### ✅ Success Tracking
- Total leads found
- Owner leads vs Client leads breakdown
- Agents detected and filtered
- Job duration and timing

### ✅ Failure Alerts
- Immediate notification of errors
- Error details and debugging info
- Job timing and duration

---

## 🚀 Quick Setup (15 minutes)

### 1. Get Resend API Key (FREE)

```bash
# 1. Sign up at Resend
https://resend.com/signup

# 2. Get your API key
https://resend.com/api-keys
# Click "Create API Key" → Copy the key (starts with re_)
```

### 2. Add to Environment

Open `.env.local` and add:

```bash
RESEND_API_KEY="re_your_actual_key_here"
RESEND_FROM_EMAIL="onboarding@resend.dev"
ADMIN_EMAIL="triquaestate@gmail.com"
```

### 3. Test Locally

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Trigger scraper
curl -X POST http://localhost:3000/api/scraper/trigger

# Wait 2-5 minutes, then check email
```

### 4. Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "Phase 8: Automated scraper with email notifications"
git push origin main

# Vercel will auto-deploy
```

### 5. Configure Vercel

**Add Environment Variables**:
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add these 3 variables:
   - `RESEND_API_KEY` = `re_your_key_here`
   - `RESEND_FROM_EMAIL` = `onboarding@resend.dev`
   - `ADMIN_EMAIL` = `triquaestate@gmail.com`
3. Click "Redeploy"

**Verify Cron Job**:
1. Go to: https://vercel.com/your-project/settings/crons
2. Verify: `/api/scraper/trigger` is active
3. Schedule: `0 */6 * * *` (every 6 hours)

---

## 📧 Email Examples

### Success Email

```
Subject: ✅ Scraper Job Completed - 12 leads found

┌─────────────────────────────────────┐
│     🎯 Lead Hunter                  │
│     Scraper Job Notification        │
└─────────────────────────────────────┘

Status: ✅ SUCCESS

Job Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Job ID:      act_abc123xyz
Source:      FACEBOOK_GROUPS
Started:     May 20, 2026, 12:00 PM
Completed:   May 20, 2026, 12:03 PM
Duration:    3m 45s

Results:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─────────────┬─────────────┐
│ Total Leads │ Owner Leads │
│     12      │      8      │
└─────────────┴─────────────┘
┌─────────────┬─────────────┐
│Client Leads │   Agents    │
│      4      │      2      │
└─────────────┴─────────────┘
```

### Failure Email

```
Subject: ❌ Scraper Job Failed - Actor timeout exceeded

┌─────────────────────────────────────┐
│     🎯 Lead Hunter                  │
│     Scraper Job Notification        │
└─────────────────────────────────────┘

Status: ❌ FAILED

Job Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Job ID:      act_abc123xyz
Source:      FACEBOOK_GROUPS
Started:     May 20, 2026, 12:00 PM
Completed:   May 20, 2026, 5:00 PM
Duration:    5h 0m

Error Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Actor timeout exceeded (18000s)
```

---

## 🔧 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL CRON JOB                      │
│              Runs every 6 hours (FREE)                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              /api/scraper/trigger                       │
│         Starts Apify Actor with webhook                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  APIFY CLOUD                            │
│         Scrapes Facebook Groups (~3-5 min)              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│             /api/webhooks/apify                         │
│    1. Process leads (AI classification)                 │
│    2. Store in Supabase                                 │
│    3. Send email notification                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ├──────────────┬──────────────┐
                     ▼              ▼              ▼
              ┌──────────┐   ┌──────────┐   ┌──────────┐
              │ Supabase │   │  Resend  │   │Dashboard │
              │ Database │   │  Email   │   │  Update  │
              └──────────┘   └──────────┘   └──────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │ triquaestate@    │
                          │   gmail.com      │
                          └──────────────────┘
```

---

## 💰 Cost Analysis

| Service | Plan | Usage | Monthly Cost |
|---------|------|-------|--------------|
| **Resend** | Free Tier | 120 emails/month | **$0** |
| **Vercel Cron** | Free | 4 runs/day | **$0** |
| **Vercel Hosting** | Hobby | Serverless | **$0** |
| **Apify** | Pay-as-you-go | 120 runs/month | **$12-60** |
| **Supabase** | Free Tier | Database + Storage | **$0** |
| | | **TOTAL** | **$12-60/month** |

**Cost Optimization Tips**:
- Keep `SCRAPER_MAX_POSTS_PER_RUN` low (10-20)
- Monitor Apify usage in dashboard
- Set spending limits in Apify console

---

## 🎛️ Configuration

### Cron Schedule

Edit `vercel.json` to change schedule:

```json
{
  "crons": [
    {
      "path": "/api/scraper/trigger",
      "schedule": "0 */6 * * *"  // Every 6 hours
    }
  ]
}
```

**Common Schedules**:
- Every 6 hours: `0 */6 * * *`
- Every 12 hours: `0 */12 * * *`
- Daily at midnight: `0 0 * * *`
- Every Monday at 9am: `0 9 * * 1`

### Email Settings

Edit `.env.local`:

```bash
# For testing (no domain needed)
RESEND_FROM_EMAIL="onboarding@resend.dev"

# For production (requires domain verification)
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Change notification recipient
ADMIN_EMAIL="your-email@example.com"
```

---

## 🧪 Testing

### Manual Trigger

```bash
# Local
curl -X POST http://localhost:3000/api/scraper/trigger

# Production
curl -X POST https://your-domain.vercel.app/api/scraper/trigger
```

### Check Logs

**Vercel Dashboard**:
1. Go to: https://vercel.com/your-project/logs
2. Filter by: `/api/scraper/trigger`
3. View execution logs

**Resend Dashboard**:
1. Go to: https://resend.com/emails
2. View sent emails
3. Check delivery status

### Test Email Service

Create a test endpoint (optional):

```typescript
// app/api/test-email/route.ts
import { sendScraperJobNotification } from '@/lib/notifications/email-service';

export async function GET() {
  await sendScraperJobNotification({
    jobId: 'test_123',
    status: 'success',
    leadsFound: 10,
    ownerLeads: 6,
    clientLeads: 4,
    agentsDetected: 2,
    startedAt: new Date(),
    completedAt: new Date(),
    duration: 180,
    source: 'TEST',
  });
  
  return Response.json({ message: 'Test email sent' });
}
```

---

## 🐛 Troubleshooting

### Email Not Received

**Check 1: Spam Folder**
- Check `triquaestate@gmail.com` spam folder
- Mark as "Not Spam" if found

**Check 2: Resend Dashboard**
- Go to: https://resend.com/emails
- Check email status (delivered, bounced, failed)
- View error logs

**Check 3: API Key**
```bash
# Verify in Vercel
echo $RESEND_API_KEY
# Should start with "re_"
```

**Check 4: Webhook Logs**
```
[Webhook] Email notification sent successfully
# or
[Webhook] Failed to send email notification: <error>
```

### Cron Not Running

**Check 1: Production Only**
- Cron jobs only work in production
- Not available on localhost
- Deploy to Vercel first

**Check 2: Vercel Dashboard**
- Go to: Settings > Crons
- Verify status is "Active"
- Check last execution time

**Check 3: Environment Variables**
- Verify all env vars are set in Vercel
- Redeploy after adding variables

**Check 4: Logs**
- Go to: Vercel > Logs
- Filter by: `/api/scraper/trigger`
- Check for errors

### Apify Errors

**Check 1: API Token**
```bash
# Verify in .env.local
echo $APIFY_API_TOKEN
# Should start with "apify_api_"
```

**Check 2: Actor ID**
```bash
# Verify correct actor
echo $APIFY_ACTOR_ID
# Should be: apify/facebook-groups-scraper
```

**Check 3: Spending Limits**
- Go to: https://console.apify.com/billing
- Check if spending limit reached
- Increase limit if needed

---

## 📊 Monitoring

### Email Delivery Rate
- Check Resend dashboard for delivery stats
- Monitor bounce rate
- Track open rate (if enabled)

### Scraper Success Rate
- Count success vs failure emails
- Track average job duration
- Monitor leads found per job

### Cost Tracking
- Monitor Apify usage daily
- Set spending alerts in Apify console
- Review monthly costs

---

## 🚀 Next Steps

### Phase 9: Dashboard Enhancements
- [ ] Add "Trigger Scrape" button
- [ ] Show last scrape time
- [ ] Display scraping job history
- [ ] Add job status indicators

### Phase 10: Image Management
- [ ] Download images on lead approval
- [ ] Upload to Supabase Storage
- [ ] Display in lead detail modal

### Phase 11: Analytics
- [ ] Lead volume over time
- [ ] Response rate tracking
- [ ] Top locations and keywords
- [ ] Performance metrics

---

## 📚 Documentation

- **Detailed Guide**: `PHASE_8_COMPLETE.md`
- **Quick Start**: `QUICK_START_PHASE_8.md`
- **Summary**: `PHASE_8_SUMMARY.md`
- **This README**: `README_PHASE_8.md`

---

## ✅ Checklist

- [x] Resend package installed
- [x] Email service created
- [x] Webhook updated
- [x] Vercel cron configured
- [x] Environment variables added
- [x] Documentation created
- [ ] Resend API key obtained
- [ ] Local test completed
- [ ] Deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] Cron job verified
- [ ] First email received

---

## 🎉 Success!

Once you complete the setup steps above, your Lead Hunter system will be fully automated:

✅ Scraper runs every 6 hours automatically  
✅ Email notifications with detailed statistics  
✅ Zero manual intervention required  
✅ Beautiful dark theme emails  
✅ Success and failure tracking  

**You'll receive emails at**: triquaestate@gmail.com

---

**Phase 8 Complete!** 🚀

Ready to move to Phase 9: Polish & Optimization
