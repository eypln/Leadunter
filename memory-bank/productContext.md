# Product Context: Lead Hunter

## Why This Exists

### The Problem
Real estate letting specialists waste hours manually:
- Scrolling through Facebook groups and Marketplace
- Identifying TWO types of opportunities:
  1. **Property owners** offering rentals (avoid agents)
  2. **Potential clients** looking for rentals in Malta
- Copying contact information
- Writing personalized outreach messages
- Switching between platforms (Facebook → WhatsApp/Messenger)
- Downloading and organizing property images

### The Pain Points
1. **Time Waste**: Manual scrolling and filtering is inefficient
2. **Missed Opportunities**: Leads get contacted by competitors first
3. **Inconsistent Outreach**: Message quality varies, no standardization
4. **Agent Noise**: 80% of listings are from agents, not direct owners
5. **Context Switching**: Jumping between apps breaks workflow

## What We're Building

### The Solution
An intelligent lead generation system that:
- **Automates Discovery**: Continuously monitors Facebook for new listings
- **Dual Lead Detection**: Identifies both OWNER and CLIENT leads
- **Smart Filtering**: AI-powered agent detection and intent analysis
- **Contact Extraction**: Finds phone numbers buried in post text
- **Image Management**: Downloads images only after manual approval (saves storage)
- **Contextual Messaging**: 
  - OWNER leads → Personalized WhatsApp/Messenger messages
  - CLIENT leads → Facebook comment "Contact for options"
- **1-Click Outreach**: Opens appropriate platform with pre-filled content

### How It Works

#### User Journey
1. **Login**: User authenticates via Facebook OAuth
2. **Dashboard**: Sees analytics (Total Leads, New, Responded, Skipped)
3. **Lead Feed**: Browses filtered listings with intent scores
4. **Review Lead**: Clicks on a lead to see details and AI-generated message
5. **Send Message**: Clicks "Send via WhatsApp" or "Send via Messenger"
6. **Track Status**: Marks lead as Responded/Skipped/Interested

#### System Flow
```
Facebook Groups/Marketplace
    ↓
Playwright Scraper (Cron Job)
    ↓
Extract: Title, Description, Author, Location, Phone, Image URLs
    ↓
AI Lead Classification (OWNER vs CLIENT)
    ↓
[OWNER Path]                    [CLIENT Path]
    ↓                               ↓
AI Intent Analysis (1-10)      Store with CLIENT type
    ↓                               ↓
Agent Filter (>5 posts)        Dashboard (CLIENT feed)
    ↓                               ↓
Database (OWNER type)          Generate comment template
    ↓                               ↓
Dashboard (OWNER feed)         1-Click Facebook comment
    ↓
User Approves Lead → Download Images
    ↓
Message Generator (AI)
    ↓
1-Click Send (wa.me / m.me)
```

## User Experience Goals

### Dashboard UX
- **Premium Feel**: Dark theme, modern SaaS aesthetic
- **Data-Driven**: Clear metrics and intent scores
- **Fast Actions**: Minimal clicks from lead discovery to message send
- **Mobile-Ready**: Responsive design, future PWA conversion

### Message Templates

#### OWNER Lead Templates

**Template A: WhatsApp (Phone Found)**
```
Hi Mr/Ms [OWNER_NAME],

I hope you're doing well! I'm Erhan, a letting specialist in QL Prime. My team and I specialize in helping landlords like you to find reliable, long-term tenants quickly and a hassle-free letting process.

If you are interested in our service, we'd be happy to answer any questions.

Looking forward to working together.
Best regards
```

**Template B: Messenger (No Phone)**
```
Hi Mr/Ms [OWNER_NAME],

I hope you're doing well! I'm an agent at Quicklets.

My team and I specialize in helping landlords like you to find reliable, long-term tenants quickly and a hassle-free letting process.

If you are interested in our service, we'd be happy to answer any questions via WhatsApp +35699690055.

Looking forward to working together.
Best regards
```

#### CLIENT Lead Template

**Facebook Comment Template**
```
Contact for options
```

**Note**: This will be posted as a comment on the CLIENT's Facebook post (person looking for rental)

## Success Metrics
- **Lead Quality**: % of leads that are actual owners (not agents)
- **Response Rate**: % of contacted leads that respond
- **Time Saved**: Hours saved vs manual process
- **Lead Volume**: New leads discovered per day
- **Conversion Rate**: Leads → Signed clients

## Future Vision
- **Phase 2**: Automated response tracking, CRM integration
- **Phase 3**: PWA for mobile-first experience
- **Phase 4**: Multi-market expansion (beyond Malta)
- **Phase 5**: AI conversation assistant for follow-ups
