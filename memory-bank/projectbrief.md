# Project Brief: Lead Hunter

## Project Name
**Lead Hunter** - Real Estate Lead Generation & Outreach Automation System

## Business Context
Real estate business in Malta seeking to identify and connect with property owners who are listing rental properties directly (bypassing agents) on Facebook Marketplace and specific Facebook Groups.

## Core Objective
Build a web application that:
1. Scrapes Facebook Marketplace and Malta real estate groups for rental listings
2. Identifies TWO lead types:
   - **OWNER**: Property owners offering rentals (filter out agents)
   - **CLIENT**: People looking to rent properties in Malta
3. Extracts contact information and property details
4. Downloads post images (only after manual approval to save storage)
5. Generates contextually appropriate outreach:
   - **OWNER leads**: Personalized WhatsApp/Messenger messages
   - **CLIENT leads**: Facebook comment "Contact for options"
6. Provides 1-click sending capability

## Target Users
- Primary: Real estate letting specialists at QL Prime/Quicklets Malta
- Use Case: Finding landlords who need help finding reliable tenants

## Key Success Criteria
1. Accurately identify direct owner listings (filter out agents)
2. Extract phone numbers and contact details from posts
3. Generate contextually appropriate messages (WhatsApp vs Messenger)
4. Provide premium, analytics-focused dashboard UI
5. Avoid Facebook account bans through semi-automated approach (draft + 1-click send)

## Business Rules

### Lead Type Classification
- **OWNER Leads** (Property owners offering rentals):
  - **Agent Detection**: If author has posted >5 rental properties, flag as agent and skip
  - **Intent Keywords**: "owner", "direct owner", "direct from owner", "no agency fee", "no commission"
  - **Action**: Generate personalized outreach message
  
- **CLIENT Leads** (People looking to rent):
  - **Intent Keywords**: "looking for rent", "looking for apartment", "looking for let", "need apartment", "searching for flat"
  - **Action**: Generate Facebook comment "Contact for options"

### Image Handling
- **Storage Optimization**: Images NOT downloaded automatically during scraping
- **Manual Approval**: Images only downloaded when user approves a lead as "NEW"
- **Rationale**: Prevent database bloat, save storage costs

### Message Personalization
- **OWNER leads**: Different templates based on phone number availability (WhatsApp vs Messenger)
- **CLIENT leads**: Simple comment template for Facebook post

### Compliance
- Semi-automated sending to avoid platform violations

## Scope Boundaries
- **In Scope**: Scraping, filtering, message generation, dashboard, lead management
- **Out of Scope**: Fully automated message sending, CRM integration (Phase 1)
- **Future**: PWA conversion, mobile app, advanced analytics

## Project Constraints
- Must use Facebook OAuth only (no other auth methods)
- Scraper must run separately from Next.js (avoid Vercel timeouts)
- All sensitive data in `.env` file
- Dark mode UI required
- Malta-specific real estate market focus
