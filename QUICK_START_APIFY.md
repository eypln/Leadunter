# 🚀 QUICK START: Apify Integration

**5-Minute Setup Guide**

---

## Step 1: Create Apify Account (2 minutes)

1. Go to [https://apify.com](https://apify.com)
2. Click **Sign Up** (free tier, no credit card)
3. Verify email

---

## Step 2: Get API Token (1 minute)

1. Log in to [Apify Console](https://console.apify.com)
2. Click your profile → **Settings** → **Integrations**
3. Copy your **API Token** (starts with `apify_api_`)

---

## Step 3: Configure Environment (1 minute)

Add to `.env.local`:

```bash
# Apify Configuration
APIFY_API_TOKEN="apify_api_xxxxxxxxxxxxxxxxxxxxx"
APIFY_ACTOR_ID="apify/facebook-pages-scraper"

# Webhook URL (use ngrok for local testing)
APIFY_WEBHOOK_URL="https://abc123.ngrok.io/api/webhooks/apify"

# Facebook Sources
FACEBOOK_MARKETPLACE_URL="https://www.facebook.com/marketplace/malta/propertyrentals"
FACEBOOK_GROUPS="https://www.facebook.com/groups/malta-rentals"
SCRAPER_MAX_POSTS_PER_RUN="50"
```

---

## Step 4: Setup Webhook URL (1 minute)

### For Local Testing (Development)

1. Install ngrok: [https://ngrok.com/download](https://ngrok.com/download)
2. Run: `ngrok http 3000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Update `.env.local`:
   ```bash
   APIFY_WEBHOOK_URL="https://abc123.ngrok.io/api/webhooks/apify"
   ```

### For Production (Vercel)

After deploying to Vercel:
```bash
APIFY_WEBHOOK_URL="https://your-app.vercel.app/api/webhooks/apify"
```

---

## Step 5: Run Database Migrations (1 minute)

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Run these files in order:
   - `supabase/add-price-field.sql`
   - `supabase/add-apify-fields.sql`

---

## Step 6: Test Scraper (5 minutes)

### Start Next.js App
```bash
npm run dev
```

### Start ngrok (in another terminal)
```bash
ngrok http 3000
```

### Trigger Scraper
```bash
curl -X POST http://localhost:3000/api/scraper/trigger
```

### Monitor Progress
1. Check terminal logs
2. Go to [Apify Console → Runs](https://console.apify.com/actors/runs)
3. Wait 5-15 minutes for completion
4. Check webhook logs in terminal

### Verify Results
```bash
# Check dashboard
http://localhost:3000/dashboard

# Or check database directly
SELECT * FROM leads ORDER BY created_at DESC LIMIT 10;
```

---

## 🎉 Done!

If you see leads in your dashboard, Phase 5 is working! 🚀

---

## 🆘 Troubleshooting

### "APIFY_API_TOKEN not configured"
→ Add your API token to `.env.local`

### "Webhook not received"
→ Make sure ngrok is running and URL matches in `.env.local`

### "No items in dataset"
→ Check Apify Console → Run Details → Dataset tab

### "All leads marked as duplicates"
→ Normal if you've already scraped these posts. Try a different Facebook Group.

---

## 📖 Full Documentation

For detailed setup, troubleshooting, and advanced configuration:
- **Setup Guide**: `PHASE_5_APIFY_SETUP.md`
- **Completion Summary**: `PHASE_5_COMPLETE.md`

---

## 🔄 Automated Scraping (Optional)

To run scraper every 6 hours automatically:

1. Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/scraper/trigger",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

2. Deploy to Vercel
3. Done! Scraper runs automatically.

---

**Need Help?** Check `PHASE_5_APIFY_SETUP.md` for detailed instructions.
