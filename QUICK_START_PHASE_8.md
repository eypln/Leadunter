# Quick Start: Phase 8 - Scraper Automation

## What You Need to Do

Phase 8 is complete! Here's what you need to do to activate automated scraping with email notifications:

---

## Step 1: Get Resend API Key (2 minutes)

1. **Sign up**: https://resend.com/signup
2. **Get API Key**: https://resend.com/api-keys
   - Click "Create API Key"
   - Name: "Lead Hunter"
   - Copy the key (starts with `re_`)

---

## Step 2: Add to Environment (1 minute)

Open `.env.local` and update:

```bash
# Find this section and add your key:
RESEND_API_KEY="re......................"
RESEND_FROM_EMAIL="onboarding@resend.dev"
ADMIN_EMAIL="triquaestate@gmail.com"
```

---

## Step 3: Test Locally (5 minutes)

```bash
# Start dev server
npm run dev

# In another terminal, trigger scraper
curl -X POST http://localhost:3000/api/scraper/trigger

# Wait 2-5 minutes for Apify to complete
# Check email: triquaestate@gmail.com
```

---

## Step 4: Deploy to Vercel (5 minutes)

```bash
# Commit and push
git add .
git commit -m "Phase 8: Scraper automation with email notifications"
git push origin main
```

**Add Environment Variables in Vercel**:
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add these 3 variables:
   - `RESEND_API_KEY` = your Resend API key
   - `RESEND_FROM_EMAIL` = `onboarding@resend.dev`
   - `ADMIN_EMAIL` = `triquaestate@gmail.com`
3. Click "Redeploy" after adding

---

## Step 5: Verify Cron Job (2 minutes)

1. Go to: https://vercel.com/your-project/settings/crons
2. You should see:
   - Path: `/api/scraper/trigger`
   - Schedule: `0 */6 * * *` (every 6 hours)
   - Status: ✅ Active

---

## Done! 🎉

Your scraper will now run automatically every 6 hours:
- **Times**: 00:00, 06:00, 12:00, 18:00 UTC
- **Email**: triquaestate@gmail.com
- **Content**: Lead statistics, owner/client breakdown, agents filtered

---

## Manual Trigger (Anytime)

```bash
# Production
curl -X POST https://your-domain.vercel.app/api/scraper/trigger

# Or in Vercel Dashboard:
# Settings > Crons > Click job > "Trigger Now"
```

---

## What You'll Receive

### Success Email
```
Subject: ✅ Scraper Job Completed - 12 leads found

- Total Leads: 12
- Owner Leads: 8
- Client Leads: 4
- Agents Filtered: 2
- Duration: 3m 45s
```

### Failure Email
```
Subject: ❌ Scraper Job Failed - Error details

- Error: Actor timeout exceeded
- Duration: 5h 0m
```

---

## Troubleshooting

**Email not received?**
1. Check spam folder
2. Verify Resend API key in Vercel
3. Check Resend dashboard: https://resend.com/emails

**Cron not running?**
1. Verify cron is active in Vercel dashboard
2. Check environment variables are set
3. Cron only works in production (not localhost)

---

## Cost

- **Resend**: FREE (3,000 emails/month)
- **Vercel Cron**: FREE
- **Apify**: ~$12-60/month (depends on usage)

---

## Next Steps

After Phase 8 is working:
- **Phase 9**: Add dashboard enhancements (trigger button, job history)
- **Phase 10**: Image download on lead approval
- **Phase 11**: Analytics and reporting

---

**Questions?** Check `PHASE_8_COMPLETE.md` for detailed documentation.
