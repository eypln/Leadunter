# 🏠 Lead Hunter

**AI-Powered Real Estate Lead Generation & Outreach Automation**

Lead Hunter is a web application designed for real estate letting specialists in Malta. It automatically scrapes Facebook Marketplace and Groups to find property rental listings posted directly by owners, filters out agents, and generates personalized outreach messages.

---

## 🎯 Key Features

- **🤖 Automated Scraping**: Monitors Facebook Marketplace and Malta real estate groups 24/7
- **🎯 Smart Filtering**: AI-powered agent detection (filters out real estate agents)
- **📊 Intent Scoring**: Rates each lead 1-10 based on likelihood of being a direct owner
- **📱 Contact Extraction**: Automatically finds phone numbers in post descriptions
- **✉️ Message Generation**: Creates personalized WhatsApp/Messenger drafts
- **🚀 1-Click Sending**: Opens WhatsApp/Messenger with pre-filled message
- **📈 Analytics Dashboard**: Track lead volume, response rates, and top keywords
- **🌙 Dark Mode UI**: Premium, modern interface optimized for long sessions

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14+** (App Router)
- **Tailwind CSS** (Dark theme)
- **Lucide React** (Icons)
- **TypeScript** (Type safety)

### Backend
- **NextAuth.js** (Facebook OAuth)
- **Prisma** (ORM)
- **PostgreSQL/Supabase** (Database)

### Scraper
- **Playwright** (Browser automation)
- **Node.js/TypeScript** (Scraper logic)
- **OpenAI/Claude API** (AI analysis)

### Deployment
- **Vercel** (Next.js app)
- **Railway/VPS** (Scraper worker)

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed
- **PostgreSQL 14+** or a Supabase account
- **Facebook Developer Account** (for OAuth)
- **OpenAI API Key** (or Anthropic Claude)
- **Git** for version control

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/lead-hunter.git
cd lead-hunter
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your credentials:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `FACEBOOK_CLIENT_ID` & `FACEBOOK_CLIENT_SECRET`: From Facebook Developer Console
- `OPENAI_API_KEY`: From OpenAI platform

### 4. Setup Database
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
ListingHunter/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── login/             # Auth pages
├── components/            # React components
│   ├── dashboard/         # Dashboard components
│   ├── leads/             # Lead components
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities and services
│   ├── services/          # Business logic
│   ├── repositories/      # Data access layer
│   └── utils/             # Helper functions
├── prisma/                # Database schema
├── scraper/               # Separate scraper worker
│   └── src/               # Scraper source code
└── memory-bank/           # Project documentation
```

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed structure.

---

## 🔧 Configuration

### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Facebook Login" product
4. Configure OAuth redirect URI: `http://localhost:3000/api/auth/callback/facebook`
5. Copy App ID and App Secret to `.env.local`

### Database Setup (Supabase)

1. Create account at [Supabase](https://supabase.com/)
2. Create new project
3. Copy connection string from Project Settings > Database
4. Paste into `.env.local` as `DATABASE_URL`

### OpenAI API Setup

1. Create account at [OpenAI Platform](https://platform.openai.com/)
2. Generate API key
3. Add to `.env.local` as `OPENAI_API_KEY`

---

## 🤖 Scraper Setup

The scraper runs as a separate worker service to avoid Vercel timeout limits.

### Local Development
```bash
cd scraper
npm install
npx playwright install  # Install browsers
cp .env.example .env
# Edit .env with your credentials
npm run scrape  # Manual test run
```

### Deploy to Railway

1. Create account at [Railway](https://railway.app/)
2. Create new project
3. Connect GitHub repository
4. Set root directory to `/scraper`
5. Add environment variables
6. Configure cron job: `0 */6 * * *` (every 6 hours)

---

## 📊 Database Schema

### Tables

- **users**: User authentication data (Facebook OAuth)
- **leads**: Scraped property listings with intent scores
- **messages**: Generated outreach messages
- **scraping_jobs**: Job tracking and analytics

See `prisma/schema.prisma` for full schema definition.

---

## 🎨 UI Components

### Dashboard
- **StatsCards**: Total Leads, New, Responded, Skipped
- **LeadFeed**: Scrollable list of leads with filters
- **DemandSignals**: Top keywords trending in listings

### Lead Detail
- **LeadInfo**: Post title, description, author, location
- **MessagePreview**: AI-generated personalized message
- **SendButtons**: 1-click WhatsApp/Messenger sending

---

## 🧠 AI Features

### Intent Scoring (1-10)
Analyzes post content for signals indicating direct owner:
- Presence of owner keywords
- Absence of agent language
- Post authenticity signals
- Contact info availability

### Agent Detection
Multi-layered approach:
1. Post count check (>5 posts = likely agent)
2. Keyword analysis ("agency", "commission")
3. Profile type (business vs personal)
4. AI contextual evaluation

### Message Generation
Two templates based on phone availability:
- **Template A**: WhatsApp message (phone found)
- **Template B**: Messenger message (no phone)

---

## 🚀 Deployment

### Next.js App (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy automatically

### Scraper Worker (Railway)

1. Create separate Railway project
2. Connect GitHub repository
3. Set root directory to `/scraper`
4. Add cron schedule: `0 */6 * * *`
5. Deploy

---

## 📈 Roadmap

### Phase 1: MVP ✅
- [x] Memory bank setup
- [ ] Database & Authentication
- [ ] Dashboard UI
- [ ] Lead management
- [ ] Message generation

### Phase 2: Scraper 🔜
- [ ] Marketplace scraper
- [ ] AI intent analysis
- [ ] Facebook Groups scraper
- [ ] Automated cron jobs

### Phase 3: Polish 🔜
- [ ] Analytics dashboard
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Error handling

### Phase 4: PWA 🔮
- [ ] Progressive Web App conversion
- [ ] Push notifications
- [ ] Offline support
- [ ] Install prompt

---

## 🤝 Contributing

This is a private project for QL Prime/Quicklets Malta. For questions or suggestions, contact the development team.

---

## 📄 License

Proprietary - All rights reserved

---

## 🆘 Support

For issues or questions:
1. Check [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
2. Review memory bank documentation in `/memory-bank`
3. Contact the development team

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- AI powered by [OpenAI](https://openai.com/)

---

**Made with ❤️ for Malta Real Estate**
