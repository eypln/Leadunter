# PHASE 5: APIFY INTEGRATION - COMPLETE SETUP GUIDE

## 🎯 Overview

Phase 5 replaces the local Playwright scraper with **Apify**, a cloud-based web scraping platform. This eliminates:
- ❌ Facebook account ban risks (Apify handles proxies and anti-detection)
- ❌ Vercel timeout issues (async webhook architecture)
- ❌ Cookie management complexity
- ❌ Need for separate Railway/VPS server

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER TRIGGERS SCRAPE                      │
│              (Manual or Cron Job via Vercel)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              POST /api/scraper/trigger                       │
│         (Starts Apify Actor with webhook config)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    APIFY CLOUD                               │
│  - Runs Facebook scraper with proxies                       │
│  - Handles anti-detection automatically                     │
│  - Scrapes for 5-15 minutes                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           POST /api/webhooks/apify                           │
│  - Receives results when scraping completes                 │
│  - Fetches dataset from Apify                               │
│  - Filters duplicates                                       │
│  - Stores leads in Supabase                                 │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Setup Steps

### Step 1: Create Apify Account

1. Go to [https://apify.com](https://apify.com)
2. Sign up for a free account
3. Free tier includes:
   - $5 free monthly credit
   - Enough for ~500-1000 Facebook posts scraped
   - No credit card required initially

### Step 2: Get API Token

1. Log in to Apify Console
2. Go to **Settings** → **Integrations**
3. Copy your **API Token**
4. Add to `.env.local`:
   ```bash
   APIFY_API_TOKEN="apify_api_xxxxxxxxxxxxxxxxxxxxx"
   ```

### Step 3: Choose Apify Actor

Apify has pre-built "Actors" (scrapers) for Facebook. Choose one:

#### Option A: Facebook Pages Scraper (Recommended)
- **Actor ID**: `apify/facebook-pages-scraper`
- **Best for**: Facebook Marketplace, public pages
- **Free tier**: Yes
- **Proxy**: Included

#### Option B: Facebook Groups Scraper
- **Actor ID**: `apify/facebook-groups-scraper`
- **Best for**: Private/public Facebook Groups
- **Free tier**: Yes
- **Proxy**: Included

Add to `.env.local`:
```bash
APIFY_ACTOR_ID="apify/facebook-pages-scraper"
```

### Step 4: Configure Webhook URL

#### Development (Local Testing)
You need a public URL for Apify to send webhooks. Use **ngrok**:

1. Install ngrok: [https://ngrok.com/download](https://ngrok.com/download)
2. Run: `ngrok http 3000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Add to `.env.local`:
   ```bash
   APIFY_WEBHOOK_URL="https://abc123.ngrok.io/api/webhooks/apify"
   ```

#### Production (Vercel)
Once deployed to Vercel:
```bash
APIFY_WEBHOOK_URL="https://your-app.vercel.app/api/webhooks/apify"
```

### Step 5: Configure Facebook Sources

Add the Facebook URLs you want to scrape:

```bash
# Facebook Marketplace (Malta rentals)
FACEBOOK_MARKETPLACE_URL="https://www.facebook.com/marketplace/malta/propertyrentals"

# Facebook Groups (comma-separated)
FACEBOOK_GROUPS="https://www.facebook.com/groups/malta-rentals,https://www.facebook.com/groups/malta-property"

# Maximum posts per scraping run
SCRAPER_MAX_POSTS_PER_RUN="50"
```

### Step 6: Run Database Migration

Run the SQL migration to add Apify-specific fields:

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Run `supabase/add-apify-fields.sql`

This adds:
- `run_id` - Apify Actor run ID
- `dataset_id` - Apify dataset ID

### Step 7: Test the Integration

#### Test 1: Check Configuration
```bash
curl http://localhost:3000/api/scraper/trigger
```

Expected response:
```json
{
  "configured": true,
  "actorId": "apify/facebook-pages-scraper",
  "webhookUrl": "https://abc123.ngrok.io/api/webhooks/apify",
  "hasApiToken": true
}
```

#### Test 2: Trigger Scraper
```bash
curl -X POST http://localhost:3000/api/scraper/trigger \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response:
```json
{
  "success": true,
  "message": "Scraper started successfully",
  "runId": "abc123xyz",
  "status": "RUNNING",
  "webhookUrl": "https://abc123.ngrok.io/api/webhooks/apify",
  "note": "Results will be sent to webhook when scraping completes"
}
```

#### Test 3: Monitor Apify Console
1. Go to [https://console.apify.com/actors/runs](https://console.apify.com/actors/runs)
2. You should see your run in progress
3. Wait for it to complete (5-15 minutes)

#### Test 4: Check Webhook Received
When Apify finishes, it will POST to your webhook URL. Check your terminal logs:
```
[Webhook] Received Apify webhook
[Webhook] Found 25 items in dataset
[Webhook] Inserted new lead: 2 Bedroom Apartment in Sliema
[Webhook] Processing complete
[Webhook] New leads: 23
[Webhook] Duplicates: 2
[Webhook] Errors: 0
```

#### Test 5: Verify Database
Check Supabase:
```sql
SELECT * FROM leads ORDER BY created_at DESC LIMIT 10;
SELECT * FROM scraping_jobs ORDER BY started_at DESC LIMIT 5;
```

## 🔧 Customizing Actor Input

The default Actor input in `app/api/scraper/trigger/route.ts` is generic. You may need to adjust it based on your chosen Actor.

### Example: Facebook Pages Scraper
```typescript
const actorInput = {
  startUrls: [
    { url: "https://www.facebook.com/marketplace/malta/propertyrentals" }
  ],
  maxPosts: 50,
  fields: ["postText", "postUrl", "authorName", "images"],
  proxyConfiguration: { useApifyProxy: true },
};
```

### Example: Facebook Groups Scraper
```typescript
const actorInput = {
  groupUrls: [
    "https://www.facebook.com/groups/malta-rentals",
    "https://www.facebook.com/groups/malta-property"
  ],
  maxPosts: 50,
  scrapeComments: false,
  proxyConfiguration: { useApifyProxy: true },
};
```

**📖 Refer to the Actor's documentation on Apify for exact input schema.**

## 🤖 Setting Up Cron Job (Automated Scraping)

### Option 1: Vercel Cron Jobs (Recommended)

1. Create `vercel.json` in project root:
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
3. Scraper will run every 6 hours automatically

### Option 2: External Cron Service

Use a service like [cron-job.org](https://cron-job.org):
1. Create account
2. Add job: `POST https://your-app.vercel.app/api/scraper/trigger`
3. Set schedule: Every 6 hours

## 🔍 Data Mapping

Apify returns data in its own format. The webhook handler maps it to our Lead structure:

| Apify Field | Our Field | Notes |
|-------------|-----------|-------|
| `postText` | `title` (first 200 chars) | Post content |
| `postText` | `description` | Full post content |
| `postUrl` | `post_url` | Unique identifier |
| `authorName` | `author_name` | Post author |
| `authorUrl` | `author_id` | Extracted from URL |
| `location` | `location` | If available |
| `images` | `image_urls` | Array of image URLs |
| - | `phone` | Extracted via regex |

## 🚨 Troubleshooting

### Issue: "APIFY_API_TOKEN not configured"
**Solution**: Add your API token to `.env.local`

### Issue: "Webhook not received"
**Solutions**:
1. Check ngrok is running: `ngrok http 3000`
2. Verify webhook URL in `.env.local` matches ngrok URL
3. Check Apify Console → Run Details → Webhooks tab

### Issue: "No items in dataset"
**Solutions**:
1. Check Apify Console → Run Details → Dataset tab
2. Verify Facebook URLs are correct
3. Actor may need Facebook login cookies (check Actor docs)

### Issue: "All leads marked as duplicates"
**Solution**: This is normal if you've already scraped these posts. Try a different Facebook Group or wait for new posts.

### Issue: "Phone numbers not extracted"
**Solution**: The regex in `extractPhoneNumber()` may need adjustment for Malta phone formats. Update the patterns in `app/api/webhooks/apify/route.ts`.

## 💰 Cost Estimation

### Apify Pricing
- **Free tier**: $5/month credit
- **Cost per run**: ~$0.01-0.05 (depends on posts scraped)
- **Estimated runs**: 100-500 runs/month on free tier

### Recommended Schedule
- **Every 6 hours**: 4 runs/day = 120 runs/month
- **Cost**: ~$1.20-6.00/month (within free tier)

## 🎉 Next Steps

Once Phase 5 is working:
1. ✅ Scraper successfully extracts leads from Facebook
2. ✅ Leads appear in dashboard
3. ✅ No duplicates inserted

**Move to Phase 6**: AI Intent Analysis
- Classify leads as OWNER vs CLIENT
- Score OWNER leads (1-10)
- Detect agents (OWNER leads only)

## 📚 Resources

- [Apify Documentation](https://docs.apify.com)
- [Facebook Pages Scraper](https://apify.com/apify/facebook-pages-scraper)
- [Facebook Groups Scraper](https://apify.com/apify/facebook-groups-scraper)
- [Apify API Reference](https://docs.apify.com/api/v2)
- [Webhook Documentation](https://docs.apify.com/webhooks)

## 🔐 Security Notes

1. **Never commit** `.env.local` to Git
2. **Rotate API tokens** regularly
3. **Use Vercel environment variables** in production
4. **Validate webhook payloads** (add signature verification if needed)
5. **Rate limit** the trigger endpoint to prevent abuse

---

**Phase 5 Status**: ✅ Code Complete - Ready for Testing
