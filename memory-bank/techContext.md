# Tech Context: Lead Hunter

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
  - Why: Server components, built-in API routes, excellent Vercel integration
  - App Router for modern React patterns
- **Styling**: Tailwind CSS
  - Dark mode configuration required
  - Custom color palette for premium feel
- **Icons**: Lucide React
  - Consistent, modern icon set
- **UI Components**: Custom components (no shadcn/ui initially)
  - Build from scratch for learning and customization

### Authentication
- **Library**: NextAuth.js v5 (Auth.js)
  - **Provider**: Facebook OAuth ONLY
  - No email/password, no other providers
  - Session management built-in

### Database
- **Provider**: Supabase (PostgreSQL)
  - Hosted PostgreSQL with real-time subscriptions
  - Built-in Storage for images
  - Built-in Auth (though we use NextAuth for Facebook OAuth)
  - Generous free tier
  - REST API and JavaScript client
- **Client**: @supabase/supabase-js
  - Official Supabase JavaScript client
  - Type-safe queries
  - Real-time subscriptions
  - Storage management

### Scraping Engine
- **Tool**: Playwright
  - **Language**: Node.js (TypeScript) preferred for consistency
  - Alternative: Python if team prefers
- **Why Playwright**:
  - Handles JavaScript-heavy sites (Facebook)
  - Browser automation with stealth mode
  - Better than Puppeteer for modern sites
  - Can handle login flows

### AI Engine
- **Primary**: OpenAI API (GPT-4 or GPT-3.5-turbo)
  - Intent scoring
  - Agent detection
  - Message generation
- **Alternative**: Anthropic Claude API
  - Better at following instructions
  - Potentially more accurate for classification
- **Usage**:
  - Analyze post content for intent
  - Score leads 1-10
  - Generate personalized messages

### Hosting & Deployment

#### Next.js App
- **Platform**: Vercel
  - Native Next.js support
  - Automatic deployments from Git
  - Edge functions for API routes
  - Free tier sufficient for MVP

#### Scraper Worker
- **Platform Options**:
  1. **Railway** (Recommended)
     - Easy deployment
     - Cron job support
     - Affordable ($5-10/month)
  2. **DigitalOcean VPS**
     - More control
     - Cron via systemd/crontab
  3. **Render**
     - Similar to Railway
     - Good free tier

### Development Tools
- **Package Manager**: npm or pnpm
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint (Next.js config)
- **Formatting**: Prettier
- **Git**: GitHub for version control

## Dependencies

### Next.js App (`package.json`)
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next-auth": "^5.0.0-beta",
    "@supabase/supabase-js": "^2.39.0",
    "lucide-react": "^0.300.0",
    "tailwindcss": "^3.4.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0"
  }
}
```

### Scraper Worker (`package.json`)
```json
{
  "dependencies": {
    "playwright": "^1.40.0",
    "@supabase/supabase-js": "^2.39.0",
    "openai": "^4.20.0",
    "dotenv": "^16.3.0",
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "@types/node-cron": "^3.0.11"
  }
}
```

## Environment Configuration

### `.env.example` Structure
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Facebook OAuth
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"

# AI Provider (choose one)
OPENAI_API_KEY="sk-..."
# ANTHROPIC_API_KEY="sk-ant-..."

# Scraper Configuration
SCRAPER_CRON_SCHEDULE="0 */6 * * *"  # Every 6 hours
FACEBOOK_EMAIL="scraper-account@example.com"
FACEBOOK_PASSWORD="secure-password"
```

## Technical Constraints

### Vercel Limitations
- **Serverless Function Timeout**: 10s (Hobby), 60s (Pro)
  - **Impact**: Cannot run scraper in Next.js API routes
  - **Solution**: Separate worker service
- **Cold Starts**: Functions may sleep
  - **Impact**: First request may be slow
  - **Solution**: Keep-alive pings or edge functions

### Facebook Scraping Challenges
- **Rate Limiting**: Facebook detects and blocks bots
  - **Solution**: Randomized delays, user-agent rotation
- **Login Required**: Most content needs authentication
  - **Solution**: Maintain logged-in session in scraper
- **Dynamic Content**: JavaScript-rendered pages
  - **Solution**: Playwright with full browser rendering
- **Account Bans**: Aggressive scraping = account suspension
  - **Solution**: Conservative scraping frequency (every 6 hours)

### AI API Costs
- **OpenAI**: ~$0.01 per lead analysis (GPT-3.5-turbo)
- **Budget**: ~$10/month for 1000 leads
- **Optimization**: Cache results, batch requests

### Database Constraints
- **Supabase Free Tier**: 500MB storage, 2GB bandwidth
  - **Estimate**: ~10,000 leads before upgrade needed
- **Connection Pooling**: Prisma handles this

## Development Setup

### Prerequisites
- Node.js 18+ (LTS)
- PostgreSQL 14+ (or Supabase account)
- Facebook Developer Account
- OpenAI API key
- Git

### Local Development Flow
1. Clone repository
2. Copy `.env.example` to `.env.local`
3. Fill in Supabase credentials and other environment variables
4. Run `npm install`
5. Run `npm run dev` (start Next.js)
6. Open `http://localhost:3000`

### Scraper Development
1. Navigate to `scraper/` directory
2. Copy `.env.example` to `.env`
3. Add Supabase credentials
4. Run `npm install`
5. Run `npx playwright install` (install browsers)
6. Run `npm run scrape` (manual test)
7. Deploy to Railway/VPS for production

## Future Technical Considerations

### PWA Conversion
- Add `manifest.json`
- Service worker for offline support
- Push notifications for new leads
- Install prompt for mobile users

### Performance Optimization
- Image optimization (Next.js Image component)
- Code splitting (automatic with App Router)
- Database indexing on frequently queried fields
- Redis caching for lead deduplication

### Monitoring & Logging
- Vercel Analytics for frontend
- Sentry for error tracking
- Custom logging for scraper jobs
- Database query performance monitoring
