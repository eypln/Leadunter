# System Patterns: Lead Hunter

## Architecture Overview

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        USER LAYER                            │
│  Next.js App (Vercel) - Dashboard, Auth, Lead Management    │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                          │
│         Supabase/PostgreSQL (Prisma ORM)                    │
│  Tables: users, leads, messages, scraping_jobs              │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                     WORKER LAYER                             │
│  Playwright Scraper (Railway/VPS) - Cron Job                │
│  AI Engine (OpenAI/Claude) - Intent Analysis                │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL LAYER                            │
│  Facebook (OAuth, Scraping), WhatsApp (wa.me), Messenger    │
└─────────────────────────────────────────────────────────────┘
```

## Key Technical Decisions

### 1. Separation of Concerns: Web App vs Scraper
**Decision**: Run scraper as separate worker process (Railway/VPS), not in Next.js
**Rationale**: 
- Vercel serverless functions have 10-60s timeout limits
- Playwright scraping can take 5-15 minutes per job
- Separate deployment allows independent scaling
- Avoids cold starts affecting scraping reliability

**Implementation**:
- Next.js app: UI, auth, lead management
- Worker service: Scheduled scraping, AI analysis
- Communication: Database as shared state

### 2. Semi-Automated Sending (Not Fully Automated)
**Decision**: Generate message drafts + 1-click send links, contextual by lead type
**Rationale**:
- Avoids Facebook/WhatsApp API restrictions
- Prevents account bans from automated messaging
- User maintains control and can personalize
- No need for WhatsApp Business API ($$$)

**Implementation by Lead Type**:

**OWNER Leads**:
- Generate personalized message text in database
- Create `wa.me/[phone]?text=[encoded_message]` links (if phone found)
- Create `m.me/[facebook_id]` links (if no phone)
- User clicks → Opens app with pre-filled message

**CLIENT Leads**:
- Generate simple comment: "Contact for options"
- Create Facebook post comment link
- User clicks → Opens Facebook with comment ready to post

### 3. AI-Powered Lead Classification & Scoring
**Decision**: Use OpenAI/Claude for dual-purpose analysis
**Rationale**:
- First classify: OWNER vs CLIENT lead type
- Then score OWNER leads (1-10) for quality
- CLIENT leads don't need scoring (all are potential clients)
- AI understands context better than keyword matching alone

**Classification Keywords**:
- **OWNER**: "for rent", "to let", "available", "owner", "direct", "no commission"
- **CLIENT**: "looking for", "need apartment", "searching for", "want to rent"

**OWNER Lead Scoring Criteria** (1-10):
- Presence of owner keywords (weight: 30%)
- Absence of agent language (weight: 25%)
- Post authenticity signals (weight: 20%)
- Contact info availability (weight: 15%)
- Post quality/completeness (weight: 10%)

**CLIENT Lead Handling**:
- No scoring needed (all are opportunities)
- Store with CLIENT type
- Generate comment template

### 4. Agent Detection Strategy
**Decision**: Multi-layered filtering approach
**Rationale**: No single method is 100% accurate

**Layers**:
1. **Post Count Check**: >5 rental posts = likely agent
2. **Keyword Analysis**: "agency", "commission", "professional service"
3. **Profile Analysis**: Business page vs personal profile
4. **AI Evaluation**: Contextual understanding of post language

### 5. Database Schema Design
**Decision**: Supabase PostgreSQL with direct SQL table creation
**Rationale**: Support workflow states and analytics

**Core Tables**:
```sql
users (id, facebook_id, email, name, avatar_url, created_at)
leads (id, post_url, title, description, author_name, author_id, 
       location, phone, lead_type, intent_score, is_agent, status, 
       image_urls, images_downloaded, created_at)
lead_images (id, lead_id, storage_path, url, created_at)
messages (id, lead_id, template_type, message_text, sent_at)
scraping_jobs (id, source, status, leads_found, started_at, completed_at)
```

### 6. Image Download Strategy
**Decision**: On-demand image downloads after manual approval
**Rationale**:
- Prevents database bloat from unused leads
- Saves storage costs (images can be large)
- User reviews lead first, then decides to download images
- Only approved leads consume storage

**Implementation**:
1. **During Scraping**: Store image URLs as JSON array in `image_urls` field
2. **User Approval**: When user marks lead as "NEW" (approved), trigger image download
3. **Download Process**: 
   - Fetch images from Facebook URLs
   - Store in cloud storage (Supabase Storage or S3)
   - Save local paths in `lead_images` table
   - Set `images_downloaded = true`
4. **Display**: Show images in lead detail view after download

## Design Patterns

### 1. Repository Pattern
- Abstract database operations behind service layer
- `LeadRepository`, `UserRepository`, `MessageRepository`, `ImageRepository`
- Use Supabase client for all database operations
- Easier to test and swap database providers

### 2. Factory Pattern
- `MessageFactory`: Creates appropriate message based on lead type and phone availability
  - OWNER + phone → WhatsApp template
  - OWNER + no phone → Messenger template
  - CLIENT → Facebook comment template
- `ScraperFactory`: Different scrapers for Marketplace vs Groups

### 3. Strategy Pattern
- `LeadClassificationStrategy`: OWNER vs CLIENT detection
- `AgentDetectionStrategy`: Pluggable agent detection methods (OWNER leads only)
- `IntentScoringStrategy`: Different AI models/approaches (OWNER leads only)

### 4. Observer Pattern
- Webhook/polling for new leads
- Real-time dashboard updates via Supabase subscriptions
- Image download trigger on lead approval

### 5. Lazy Loading Pattern
- Images loaded on-demand (not during scraping)
- Reduces initial storage footprint
- Improves scraper performance

## Component Relationships

### Frontend Components
```
App Layout (Dark Theme)
├── AuthProvider (NextAuth)
├── Dashboard
│   ├── LeadTypeToggle (OWNER / CLIENT tabs)
│   ├── StatsCards (Total, New, Responded, Skipped) - per lead type
│   ├── LeadFeed
│   │   ├── LeadCard
│   │   │   ├── LeadTypeBadge (OWNER/CLIENT)
│   │   │   ├── IntentBadge (OWNER only)
│   │   │   ├── StatusBadge
│   │   │   ├── ImageThumbnail (if downloaded)
│   │   │   └── ActionButtons
│   │   └── LeadFilters (by type, status, score)
│   └── DemandSignals (Top Keywords) - per lead type
└── LeadDetail
    ├── LeadInfo
    ├── ImageGallery (download button if not downloaded)
    ├── MessagePreview (contextual by lead type)
    └── SendButtons
        ├── WhatsApp/Messenger (OWNER leads)
        └── Facebook Comment (CLIENT leads)
```

### Backend Services
```
API Routes (Next.js)
├── /api/auth/[...nextauth] (Facebook OAuth)
├── /api/leads (GET with ?type=OWNER|CLIENT, PATCH)
├── /api/leads/[id] (GET, PATCH)
├── /api/leads/[id]/images (POST - trigger download)
├── /api/messages/generate (POST - contextual by lead type)
└── /api/scraping/trigger (POST - admin only)

Worker Services (Separate Process)
├── ScrapingService
│   ├── FacebookMarketplaceScraper
│   └── FacebookGroupScraper
├── AIService
│   ├── LeadClassifier (OWNER vs CLIENT)
│   ├── IntentAnalyzer (OWNER leads only)
│   └── AgentDetector (OWNER leads only)
├── MessageGenerator (contextual by lead type)
└── ImageDownloader (on-demand service)
```

## Security Patterns

### 1. Environment Variable Management
- All secrets in `.env` (never committed)
- Separate `.env.local` for development
- Vercel environment variables for production

### 2. Authentication Flow
- Facebook OAuth only (no password storage)
- NextAuth session management
- Protected API routes with middleware

### 3. Rate Limiting
- Scraper: Randomized delays between requests
- API: Rate limit per user/IP
- AI calls: Queue system to avoid quota exhaustion

### 4. Data Privacy
- No storage of Facebook passwords
- Phone numbers encrypted at rest
- GDPR-compliant data retention policies

## Scalability Considerations

### Current Phase (MVP)
- Single scraper instance
- Supabase free tier
- Vercel hobby plan

### Future Scaling
- Multiple scraper workers (parallel processing)
- Redis cache for lead deduplication
- CDN for static assets
- Database read replicas for analytics
