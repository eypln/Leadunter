# Lead Hunter - Project File Structure

## Overview
This document defines the complete file structure for the Lead Hunter application. The project is split into two main parts:
1. **Next.js Web Application** (main directory)
2. **Scraper Worker** (separate service in `/scraper` directory)

---

## Root Directory Structure

```
ListingHunter/
├── .env.example                 # Environment variables template
├── .env.local                   # Local environment (gitignored)
├── .gitignore                   # Git ignore rules
├── .clinerules                  # Project intelligence for Cline
├── package.json                 # Next.js app dependencies
├── tsconfig.json                # TypeScript configuration
├── next.config.js               # Next.js configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── README.md                    # Project documentation
├── PROJECT_STRUCTURE.md         # This file
│
├── memory-bank/                 # Cline's memory bank
│   ├── projectbrief.md
│   ├── productContext.md
│   ├── systemPatterns.md
│   ├── techContext.md
│   ├── activeContext.md
│   └── progress.md
│
├── prisma/                      # Database schema and migrations
│   ├── schema.prisma            # Database schema definition
│   ├── migrations/              # Database migrations
│   └── seed.ts                  # Database seeding script
│
├── public/                      # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   ├── manifest.json            # PWA manifest (Phase 10)
│   └── icons/                   # PWA icons
│
├── app/                         # Next.js App Router
│   ├── layout.tsx               # Root layout (dark theme)
│   ├── page.tsx                 # Home/Dashboard page
│   ├── globals.css              # Global styles (Tailwind)
│   │
│   ├── api/                     # API routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts     # NextAuth configuration
│   │   ├── leads/
│   │   │   ├── route.ts         # GET /api/leads?type=OWNER|CLIENT
│   │   │   └── [id]/
│   │   │       ├── route.ts     # GET, PATCH /api/leads/:id
│   │   │       └── images/
│   │   │           └── route.ts # POST /api/leads/:id/images (download)
│   │   ├── messages/
│   │   │   └── generate/
│   │   │       └── route.ts     # POST /api/messages/generate
│   │   ├── stats/
│   │   │   └── route.ts         # GET /api/stats?type=OWNER|CLIENT
│   │   └── scraping/
│   │       └── trigger/
│   │           └── route.ts     # POST /api/scraping/trigger (admin)
│   │
│   ├── dashboard/               # Dashboard pages
│   │   ├── page.tsx             # Main dashboard
│   │   └── leads/
│   │       └── [id]/
│   │           └── page.tsx     # Lead detail page
│   │
│   └── login/                   # Authentication pages
│       └── page.tsx             # Login page
│
├── components/                  # React components
│   ├── layout/
│   │   ├── AppLayout.tsx        # Main app layout wrapper
│   │   ├── Navbar.tsx           # Top navigation bar
│   │   └── Sidebar.tsx          # Side navigation (if needed)
│   │
│   ├── dashboard/
│   │   ├── LeadTypeToggle.tsx   # OWNER/CLIENT tab switcher
│   │   ├── StatsCards.tsx       # Stats overview cards
│   │   ├── LeadFeed.tsx         # Lead list/feed
│   │   ├── LeadCard.tsx         # Individual lead card
│   │   ├── LeadFilters.tsx      # Filter controls
│   │   └── DemandSignals.tsx    # Top keywords widget
│   │
│   ├── leads/
│   │   ├── LeadDetail.tsx       # Lead detail view
│   │   ├── LeadInfo.tsx         # Lead information display
│   │   ├── ImageGallery.tsx     # Lead images display
│   │   ├── ImageDownloadButton.tsx  # Trigger image download
│   │   ├── MessagePreview.tsx   # Generated message preview
│   │   ├── SendButtons.tsx      # WhatsApp/Messenger/Comment buttons
│   │   ├── LeadTypeBadge.tsx    # OWNER/CLIENT badge
│   │   ├── IntentBadge.tsx      # Intent score badge
│   │   └── StatusBadge.tsx      # Lead status badge
│   │
│   ├── auth/
│   │   └── LoginButton.tsx      # Facebook OAuth login button
│   │
│   └── ui/                      # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Modal.tsx
│       └── LoadingSpinner.tsx
│
├── lib/                         # Utility libraries and services
│   ├── auth.ts                  # NextAuth configuration
│   ├── db.ts                    # Prisma client instance
│   │
│   ├── services/                # Business logic services
│   │   ├── leadService.ts       # Lead CRUD operations
│   │   ├── messageService.ts    # Message generation logic
│   │   ├── statsService.ts      # Dashboard statistics
│   │   ├── aiService.ts         # AI API integration
│   │   └── imageService.ts      # Image download service
│   │
│   ├── repositories/            # Data access layer
│   │   ├── leadRepository.ts
│   │   ├── userRepository.ts
│   │   ├── messageRepository.ts
│   │   └── imageRepository.ts
│   │
│   ├── utils/                   # Helper functions
│   │   ├── phoneExtractor.ts    # Phone number regex extraction
│   │   ├── messageTemplates.ts  # Message template logic
│   │   ├── leadClassifier.ts    # OWNER vs CLIENT classification
│   │   ├── dateFormatter.ts     # Date formatting utilities
│   │   └── validators.ts        # Input validation (Zod schemas)
│   │
│   └── constants/               # Application constants
│       ├── ownerKeywords.ts     # OWNER intent keywords
│       ├── clientKeywords.ts    # CLIENT intent keywords
│       ├── agentKeywords.ts     # Agent detection keywords
│       └── config.ts            # App configuration
│
├── types/                       # TypeScript type definitions
│   ├── lead.ts                  # Lead-related types (LeadType enum)
│   ├── message.ts               # Message-related types
│   ├── user.ts                  # User-related types
│   ├── image.ts                 # Image-related types
│   └── api.ts                   # API request/response types
│
└── scraper/                     # Separate scraper worker service
    ├── .env.example             # Scraper environment variables
    ├── .env                     # Scraper environment (gitignored)
    ├── package.json             # Scraper dependencies
    ├── tsconfig.json            # Scraper TypeScript config
    ├── README.md                # Scraper documentation
    │
    ├── src/
    │   ├── index.ts             # Main entry point (cron job)
    │   │
    │   ├── scrapers/            # Scraper implementations
    │   │   ├── baseScraper.ts   # Abstract base scraper
    │   │   ├── marketplaceScraper.ts  # Facebook Marketplace
    │   │   └── groupScraper.ts  # Facebook Groups
    │   │
    │   ├── services/            # Scraper services
    │   │   ├── aiService.ts     # AI intent analysis
    │   │   ├── agentDetector.ts # Agent detection logic
    │   │   └── dbService.ts     # Database operations
    │   │
    │   ├── utils/               # Scraper utilities
    │   │   ├── phoneExtractor.ts  # Phone number extraction
    │   │   ├── stealth.ts       # Playwright stealth config
    │   │   └── logger.ts        # Logging utility
    │   │
    │   └── config/              # Scraper configuration
    │       ├── groups.ts        # Facebook groups list
    │       └── constants.ts     # Scraper constants
    │
    └── scripts/                 # Utility scripts
        ├── test-scraper.ts      # Manual scraper test
        └── deploy.sh            # Deployment script
```

---

## Key Files Explained

### Configuration Files

#### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['facebook.com', 'scontent.xx.fbcdn.net'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
```

#### `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom dark theme colors
        dark: {
          bg: '#0a0e1a',
          card: '#141824',
          border: '#1f2937',
        },
      },
    },
  },
  plugins: [],
}
```

#### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Database Schema (Prisma)

### `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  facebookId    String    @unique
  email         String?   @unique
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Lead {
  id                String      @id @default(cuid())
  postUrl           String      @unique
  title             String
  description       String      @db.Text
  authorName        String
  authorId          String?
  location          String?
  phone             String?
  leadType          LeadType    // OWNER or CLIENT
  intentScore       Int?        // 1-10 (OWNER leads only)
  isAgent           Boolean     @default(false) // OWNER leads only
  status            LeadStatus  @default(NEW)
  source            String      // "marketplace" or "group"
  imageUrls         Json?       // Array of Facebook image URLs
  imagesDownloaded  Boolean     @default(false)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  messages          Message[]
  images            LeadImage[]
  
  @@index([status])
  @@index([leadType])
  @@index([intentScore])
  @@index([createdAt])
  @@index([imagesDownloaded])
}

model LeadImage {
  id            String    @id @default(cuid())
  leadId        String
  lead          Lead      @relation(fields: [leadId], references: [id], onDelete: Cascade)
  imageUrl      String    // Original Facebook URL
  localPath     String    // Path in storage (Supabase/S3)
  downloadedAt  DateTime  @default(now())
  
  @@index([leadId])
}

model Message {
  id            String    @id @default(cuid())
  leadId        String
  lead          Lead      @relation(fields: [leadId], references: [id], onDelete: Cascade)
  templateType  String    // "whatsapp", "messenger", or "facebook_comment"
  messageText   String    @db.Text
  sentAt        DateTime?
  createdAt     DateTime  @default(now())
  
  @@index([leadId])
}

model ScrapingJob {
  id            String    @id @default(cuid())
  source        String    // "marketplace" or "group"
  leadType      LeadType? // Filter by lead type (optional)
  status        JobStatus @default(RUNNING)
  leadsFound    Int       @default(0)
  errorMessage  String?   @db.Text
  startedAt     DateTime  @default(now())
  completedAt   DateTime?
}

enum LeadType {
  OWNER   // Property owners offering rentals
  CLIENT  // People looking to rent
}

enum LeadStatus {
  NEW
  RESPONDED
  SKIPPED
  INTERESTED
}

enum JobStatus {
  RUNNING
  COMPLETED
  FAILED
}
```

---

## Next Steps

1. **Initialize Next.js Project**
   ```bash
   npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
   ```

2. **Install Dependencies**
   ```bash
   npm install next-auth@beta prisma @prisma/client lucide-react zod
   npm install -D @types/node
   ```

3. **Setup Prisma**
   ```bash
   npx prisma init
   # Edit prisma/schema.prisma
   npx prisma migrate dev --name init
   ```

4. **Create Directory Structure**
   ```bash
   mkdir -p components/{layout,dashboard,leads,auth,ui}
   mkdir -p lib/{services,repositories,utils,constants}
   mkdir -p types
   mkdir -p scraper/src/{scrapers,services,utils,config}
   ```

5. **Copy `.env.example` to `.env.local`** and fill in values

---

## Deployment Structure

### Vercel (Next.js App)
- Automatic deployment from Git
- Environment variables configured in Vercel dashboard
- Database connection via DATABASE_URL

### Railway (Scraper Worker)
- Separate Git repository or monorepo with `/scraper` directory
- Cron job configured via Railway
- Same DATABASE_URL as Next.js app

---

**Ready to proceed with Phase 1: Database & Authentication setup?**
