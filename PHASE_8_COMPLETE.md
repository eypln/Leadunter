# Phase 8: Scraper Automation - COMPLETE ✅

## Overview
Phase 8 implements automated scraper scheduling with email notifications. The scraper now runs automatically every 6 hours via Vercel Cron Jobs and sends detailed email reports to the admin.

---

## What Was Implemented

### 1. Email Notification Service ✅
**File**: `lib/notifications/email-service.ts`

**Features**:
- Beautiful HTML email templates with dark theme
- Success and failure notifications
- Detailed job statistics (leads found, owner/client breakdown, agents filtered)
- Job duration tracking
- Error reporting for failed jobs
- Powered by Resend (free tier available)

**Email Content**:
- **Success Emails**: Show total leads, owner leads, client leads, agents filtered
- **Failure Emails**: Show error details and job information
- **Design**: Premium dark theme matching dashboard UI
- **Recipient**: Configurable via `ADMIN_EMAIL` env variable (default: triquaestate@gmail.com)

### 2. Webhook Email Integration ✅
**File**: `app/api/webhooks/apify/route.ts`

**Enhancements**:
- Sends email notification on successful scraping completion
- Sends email notification on scraping failure
- Includes detailed statistics in email
- Non-blocking (doesn't fail webhook if email fails)
- Calculates job duration automatically

### 3. Vercel Cron Job Configuration ✅
**File**: `vercel.json`

**Schedule**: Every 6 hours (0 */6 * * *)
- Runs at: 00:00, 06:00, 12:00, 18:00 UTC
- Automatically triggers `/api/scraper/trigger`
- No manual intervention needed
- Only works in production (not localhost)

**Cron Expression Breakdown**:
```
0 */6 * * *
│  │  │ │ │
│  │  │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│  │  │ └───── Month (1-12)
│  │  └─────── Day of month (1-31)
│  └────────── Hour (0-23) - Every 6 hours
└───────────── Minute (0-59) - At minute 0
```

### 4. Environment Configuration ✅
**Files**: `.env.example`, `.env.local`

**New Variables**:
```bash
# Resend API (Email Service)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="onboarding@resend.dev"  # Use this for testing
ADMIN_EMAIL="triquaestate@gmail.com"       # Where to send notifications
```

---

## Setup Instructions

### Step 1: Get Resend API Key (FREE)

1. **Sign up for Resend**:
   - Go to: https://resend.com/signup
   - Sign up with your email
   - Verify your email address

2. **Get API Key**:
   - Go to: https://resend.com/api-keys
   - Click "Create API Key"
   - Name: "Lead Hunter Notifications"
   - Permissions: "Sending access"
   - Copy the API key (starts with `re_`)

3. **Add to Environment**:
   ```bash
   # In .env.local
   RESEND_API_KEY="re_your_actual_api_key_here"
   ```

### Step 2: Configure Email Settings

**For Testing (No Domain Required)**:
```bash
RESEND_FROM_EMAIL="onboarding@resend.dev"
ADMIN_EMAIL="triquaestate@gmail.com"
```

**For Production (Custom Domain)**:
1. Add your domain in Resend dashboard
2. Verify DNS records
3. Update `.env.local`:
   ```bash
   RESEND_FROM_EMAIL="noreply@yourdomain.com"
   ADMIN_EMAIL="triquaestate@gmail.com"
   ```

### Step 3: Test Email Notifications Locally

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Trigger a Test Scrape**:
   ```bash
   # Using curl (Windows CMD)
   curl -X POST http://localhost:3000/api/scraper/trigger
   
   # Or using PowerShell
   Invoke-WebRequest -Uri http://localhost:3000/api/scraper/trigger -Method POST
   ```

3. **Wait for Webhook**:
   - Apify will scrape Facebook Groups
   - When complete, webhook receives results
   - Email notification is sent automatically
   - Check `triquaestate@gmail.com` inbox

4. **Check Logs**:
   ```
   [Webhook] Email notification sent successfully
   ```

### Step 4: Deploy to Vercel (Enable Cron)

1. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Phase 8: Add scraper automation with email notifications"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Vercel will auto-deploy from GitHub
   - Or manually: `vercel --prod`

3. **Add Environment Variables in Vercel**:
   - Go to: https://vercel.com/your-project/settings/environment-variables
   - Add:
     - `RESEND_API_KEY`
     - `RESEND_FROM_EMAIL`
     - `ADMIN_EMAIL`
   - Redeploy after adding variables

4. **Verify Cron Job**:
   - Go to: https://vercel.com/your-project/settings/crons
   - You should see: `/api/scraper/trigger` scheduled for `0 */6 * * *`
   - Status: Active

### Step 5: Monitor Automated Scraping

**Cron Schedule**:
- Runs every 6 hours: 00:00, 06:00, 12:00, 18:00 UTC
- Converts to your timezone automatically

**Email Notifications**:
- ✅ Success: Receive email with lead statistics
- ❌ Failure: Receive email with error details
- 📧 Recipient: `triquaestate@gmail.com`

**Check Logs in Vercel**:
1. Go to: https://vercel.com/your-project/logs
2. Filter by: `/api/scraper/trigger`
3. View execution logs and errors

---

## Email Notification Examples

### Success Email
```
Subject: ✅ Scraper Job Completed - 12 leads found

Content:
- Job ID: act_abc123xyz
- Source: FACEBOOK_GROUPS
- Duration: 3m 45s
- Total Leads: 12
- Owner Leads: 8
- Client Leads: 4
- Agents Filtered: 2
```

### Failure Email
```
Subject: ❌ Scraper Job Failed - Actor timeout exceeded

Content:
- Job ID: act_abc123xyz
- Source: FACEBOOK_GROUPS
- Duration: 5h 0m
- Error: Actor timeout exceeded (18000s)
```

---

## Testing Checklist

- [x] ✅ Resend package installed
- [x] ✅ Email service created (`lib/notifications/email-service.ts`)
- [x] ✅ Webhook updated with email notifications
- [x] ✅ Environment variables added (`.env.example`, `.env.local`)
- [x] ✅ Vercel cron configuration created (`vercel.json`)
- [ ] ⏳ Resend API key obtained (USER ACTION REQUIRED)
- [ ] ⏳ Test email sent locally (USER ACTION REQUIRED)
- [ ] ⏳ Deployed to Vercel with env vars (USER ACTION REQUIRED)
- [ ] ⏳ Cron job verified in Vercel dashboard (USER ACTION REQUIRED)
- [ ] ⏳ First automated email received (USER ACTION REQUIRED)

---

## Manual Trigger (For Testing)

You can manually trigger the scraper anytime:

**Via Dashboard** (Future Enhancement):
- Add a "Trigger Scrape" button in dashboard

**Via API**:
```bash
# Local
curl -X POST http://localhost:3000/api/scraper/trigger

# Production
curl -X POST https://your-domain.vercel.app/api/scraper/trigger
```

**Via Vercel Dashboard**:
1. Go to: https://vercel.com/your-project/settings/crons
2. Click on the cron job
3. Click "Trigger Now"

---

## Cost Considerations

### Resend (Email Service)
- **Free Tier**: 3,000 emails/month
- **Cost**: $0 for moderate usage
- **Estimate**: 4 emails/day × 30 days = 120 emails/month (well within free tier)

### Apify (Scraping)
- **Cost**: ~$0.10 - $0.50 per scrape (depends on posts scraped)
- **Frequency**: 4 times/day × 30 days = 120 scrapes/month
- **Estimate**: $12 - $60/month
- **Optimization**: Keep `SCRAPER_MAX_POSTS_PER_RUN` low (10-20)

### Vercel (Hosting)
- **Cron Jobs**: Free on all plans
- **Serverless Functions**: Free tier sufficient
- **Cost**: $0 for MVP

**Total Monthly Cost**: ~$12 - $60 (mostly Apify)

---

## Troubleshooting

### Email Not Received

**Check 1: Resend API Key**
```bash
# Verify in .env.local
echo $RESEND_API_KEY
```

**Check 2: Spam Folder**
- Check `triquaestate@gmail.com` spam folder
- Mark as "Not Spam" if found

**Check 3: Resend Dashboard**
- Go to: https://resend.com/emails
- Check email delivery status
- View error logs

**Check 4: Webhook Logs**
```
[Webhook] Email notification sent successfully
# or
[Webhook] Failed to send email notification: <error>
```

### Cron Job Not Running

**Check 1: Vercel Dashboard**
- Go to: https://vercel.com/your-project/settings/crons
- Verify cron is "Active"
- Check last execution time

**Check 2: Environment Variables**
- Verify all required env vars are set in Vercel
- Redeploy after adding variables

**Check 3: Logs**
- Go to: https://vercel.com/your-project/logs
- Filter by: `/api/scraper/trigger`
- Check for errors

**Note**: Cron jobs only work in production, not localhost!

### Email Formatting Issues

**Check 1: HTML Rendering**
- Test email in different clients (Gmail, Outlook, etc.)
- Some clients may strip CSS

**Check 2: Content Escaping**
- Error messages with special characters may break HTML
- Email service handles basic escaping

---

## Next Steps

### Phase 9: Polish & Optimization
- [ ] Add "Trigger Scrape" button in dashboard
- [ ] Show last scrape time in dashboard
- [ ] Add scraping job history page
- [ ] Implement image download on lead approval
- [ ] Add toast notifications for user actions
- [ ] Optimize database queries with indexes
- [ ] Add analytics dashboard

### Future Enhancements
- [ ] Slack notifications (alternative to email)
- [ ] SMS notifications for critical alerts
- [ ] Customizable email templates
- [ ] Email digest (daily summary instead of per-job)
- [ ] Webhook retry logic for failed deliveries

---

## Files Modified/Created

### Created
- ✅ `lib/notifications/email-service.ts` - Email notification service
- ✅ `vercel.json` - Vercel cron configuration
- ✅ `PHASE_8_COMPLETE.md` - This documentation

### Modified
- ✅ `app/api/webhooks/apify/route.ts` - Added email notifications
- ✅ `.env.example` - Added Resend configuration
- ✅ `.env.local` - Added Resend configuration
- ✅ `package.json` - Added `resend` dependency

---

## Summary

Phase 8 successfully implements:
1. ✅ **Automated Scraping**: Runs every 6 hours via Vercel Cron
2. ✅ **Email Notifications**: Beautiful HTML emails with job statistics
3. ✅ **Success Tracking**: Detailed breakdown of leads found
4. ✅ **Failure Alerts**: Immediate notification of scraping errors
5. ✅ **Zero Maintenance**: Fully automated, no manual intervention needed

**Status**: READY FOR DEPLOYMENT

**Next Action**: User needs to:
1. Get Resend API key (free)
2. Add to `.env.local`
3. Test locally
4. Deploy to Vercel
5. Verify first automated email

---

**Phase 8 Complete!** 🎉
