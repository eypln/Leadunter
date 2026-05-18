# Active Context: Lead Hunter

## Current Status
**Phase**: Phase 1 - Database & Authentication
**Date**: May 18, 2026
**Progress**: 0% - Ready to start Phase 1

## What We're Working On Now
✅ **PHASE 0 COMPLETED**: Project initialization complete!

**COMPLETED**:
1. ✅ Memory bank structure created (all 6 core files)
2. ✅ Project file structure defined (PROJECT_STRUCTURE.md)
3. ✅ Environment configuration created (.env.example)
4. ✅ Project intelligence documented (.clinerules)
5. ✅ README.md created with setup instructions
6. ✅ Next.js 14 project initialized with App Router
7. ✅ TypeScript configured with strict mode
8. ✅ Tailwind CSS configured with dark mode
9. ✅ All dependencies installed (404 packages)
10. ✅ Dev server tested and working (http://localhost:3000)

**NEXT**: Phase 1 - Database & Authentication
- Setup Prisma with PostgreSQL/Supabase
- Define database schema with dual lead types (OWNER/CLIENT)
- Configure NextAuth.js with Facebook OAuth

## Recent Changes
- ✅ **PHASE 0 COMPLETED** (May 18, 2026)
- ✅ Created Next.js 14 project with App Router
- ✅ Configured TypeScript with strict mode and path aliases (@/*)
- ✅ Configured Tailwind CSS with dark mode enabled by default
- ✅ Created project structure (app/, components/, lib/, prisma/, scraper/, public/)
- ✅ Installed all dependencies (next, react, next-auth, prisma, lucide-react, etc.)
- ✅ Created basic layout and home page with dark theme
- ✅ Configured Next.js for Facebook image domains
- ✅ Tested dev server successfully (Ready in 6.1s)

## Next Immediate Steps

### Phase 1: Database & Authentication

**Step 1: Setup Supabase Connection**
- Add Supabase credentials to .env.local
- Install @supabase/supabase-js package
- Create Supabase client utility in /lib
- Test database connection

**Step 2: Create Database Tables**
Create tables in Supabase SQL Editor:
- `users`: Authentication and user data
- `leads`: Scraped listings with leadType (OWNER/CLIENT), imageUrls (JSON), imagesDownloaded (Boolean)
- `lead_images`: Downloaded images (created after approval)
- `messages`: Generated outreach messages (contextual by lead type)
- `scraping_jobs`: Job tracking and analytics

**Step 3: Setup Supabase Storage**
- Create storage bucket for lead images
- Configure bucket policies
- Test image upload/download

**Step 4: Configure NextAuth.js**
- Setup Facebook OAuth provider
- Create auth API routes
- Configure session management
- Integrate with Supabase users table

**Step 5: Test Authentication**
- Create login page
- Test Facebook login flow
- Verify session management
- Test protected routes

## Active Decisions & Considerations

### Decision 1: Dual Lead Type System ✅ CONFIRMED
**Options**: Single lead type (OWNER only) vs Dual lead types (OWNER + CLIENT)
**Decision**: Dual lead type system
**Reasoning**: 
- OWNER leads: Property owners offering rentals (filter agents, score intent)
- CLIENT leads: People looking to rent (all are opportunities, no scoring needed)
- Different messaging strategies per type
- Maximizes business opportunities
**Status**: Confirmed by user

### Decision 2: Image Download Strategy ✅ CONFIRMED
**Options**: Auto-download during scraping vs On-demand after approval
**Decision**: On-demand after manual approval
**Reasoning**:
- Prevents database bloat from unused leads
- Saves storage costs (images can be large)
- User reviews lead first, then decides to download
- Only approved leads consume storage
**Status**: Confirmed by user

### Decision 3: Scraper Language
**Options**: Node.js (TypeScript) vs Python
**Leaning Towards**: Node.js for consistency with Next.js
**Reasoning**: 
- Same language across stack
- Easier to share types and utilities
- Team familiarity
**Status**: Awaiting user confirmation

### Decision 4: Database Provider
**Options**: Supabase vs Self-hosted PostgreSQL
**Leaning Towards**: Supabase for MVP
**Reasoning**:
- Faster setup
- Built-in Storage for images
- Built-in real-time features
- Free tier sufficient for testing
- Can migrate later if needed
**Status**: Awaiting user confirmation

### Decision 5: AI Provider
**Options**: OpenAI vs Anthropic Claude
**Leaning Towards**: OpenAI (GPT-3.5-turbo)
**Reasoning**:
- Lower cost for MVP
- Faster response times
- Well-documented API
- Can upgrade to GPT-4 later
**Status**: Awaiting user confirmation

## Current Blockers
None - ready to proceed with implementation

## Questions for User
1. Do you have Facebook Developer credentials ready, or do we need to set that up?
2. Do you have an OpenAI API key, or should we use Claude?
3. Preferred database: Supabase (easier) or self-hosted PostgreSQL (more control)?
4. Do you want to start with the Next.js app first, or set up the scraper simultaneously?

## Context for Next Session
When resuming work:
1. Read all memory bank files (especially `progress.md` for current phase)
2. Check this file for latest decisions and blockers
3. Review `progress.md` to see which tasks are completed
4. Continue from the next incomplete task in the current phase

## Notes
- User provided a reference image showing the desired dashboard UI (dark theme, stats cards, lead feed, demand signals)
- User wants step-by-step implementation with confirmation after each major module
- User is in Malta timezone, real estate business context
- Project name is "Lead Hunter" (also referred to as "ListingHunter" in folder name)
- **NEW**: System must handle TWO lead types (OWNER and CLIENT)
- **NEW**: Images downloaded only after manual approval (not during scraping)
- **NEW**: CLIENT leads get simple Facebook comment, not personalized messages
