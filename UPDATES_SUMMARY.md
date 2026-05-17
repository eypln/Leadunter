# 🔄 Lead Hunter - Updates Summary

## ✅ Major Updates Applied

### 1. **Dual Lead Type System** 🎯

The system now handles TWO distinct types of leads:

#### **OWNER Leads** (Property Owners Offering Rentals)
- **Detection Keywords**: "owner", "direct owner", "for rent", "to let", "available", "no commission"
- **Processing**:
  - ✅ Agent detection (>5 posts = agent, skip)
  - ✅ AI intent scoring (1-10)
  - ✅ Personalized WhatsApp/Messenger messages
  - ✅ Image download after approval
- **Message Templates**:
  - Template A: WhatsApp (if phone found)
  - Template B: Messenger (if no phone)

#### **CLIENT Leads** (People Looking to Rent)
- **Detection Keywords**: "looking for rent", "looking for apartment", "need apartment", "searching for flat", "want to rent"
- **Processing**:
  - ✅ No agent detection (all are potential clients)
  - ✅ No intent scoring needed
  - ✅ Simple Facebook comment template
  - ✅ Image download after approval
- **Message Template**:
  - Template C: "Contact for options" (Facebook comment)

---

### 2. **Image Download Strategy** 📸

**Problem**: Automatically downloading all images would bloat the database and waste storage.

**Solution**: On-demand image downloads after manual approval

#### How It Works:
1. **During Scraping**: 
   - Extract image URLs from Facebook posts
   - Store URLs as JSON array in `imageUrls` field
   - Do NOT download images yet

2. **User Reviews Lead**:
   - User sees lead in dashboard
   - Decides if lead is worth pursuing
   - Clicks "Approve" or marks as "NEW"

3. **Trigger Download**:
   - System downloads images from Facebook URLs
   - Uploads to Supabase Storage or S3
   - Stores local paths in `lead_images` table
   - Sets `imagesDownloaded = true`

4. **Display Images**:
   - Images appear in lead detail view
   - User can view full gallery

#### Benefits:
- ✅ Saves storage costs (only approved leads consume space)
- ✅ Prevents database bloat from unused leads
- ✅ Faster scraping (no download overhead)
- ✅ User maintains control over storage usage

---

### 3. **Updated Database Schema** 🗄️

#### New Fields in `Lead` Table:
```prisma
model Lead {
  // ... existing fields ...
  
  leadType          LeadType    // NEW: OWNER or CLIENT
  imageUrls         Json?       // NEW: Array of Facebook image URLs
  imagesDownloaded  Boolean     @default(false) // NEW: Download status
  
  images            LeadImage[] // NEW: Relation to downloaded images
  
  @@index([leadType])           // NEW: Index for filtering
  @@index([imagesDownloaded])   // NEW: Index for download status
}
```

#### New `LeadImage` Table:
```prisma
model LeadImage {
  id            String    @id @default(cuid())
  leadId        String
  lead          Lead      @relation(fields: [leadId], references: [id])
  imageUrl      String    // Original Facebook URL
  localPath     String    // Path in Supabase Storage/S3
  downloadedAt  DateTime  @default(now())
  
  @@index([leadId])
}
```

#### New `LeadType` Enum:
```prisma
enum LeadType {
  OWNER   // Property owners offering rentals
  CLIENT  // People looking to rent
}
```

#### Updated `Message` Table:
```prisma
model Message {
  // ... existing fields ...
  
  templateType  String  // "whatsapp", "messenger", or "facebook_comment"
}
```

---

### 4. **Updated API Routes** 🔌

#### New/Modified Endpoints:

**GET /api/leads?type=OWNER|CLIENT**
- Filter leads by type
- Returns leads with image URLs (not downloaded images)

**GET /api/stats?type=OWNER|CLIENT**
- Dashboard statistics per lead type
- Separate counts for OWNER and CLIENT leads

**POST /api/leads/:id/images**
- Trigger image download for approved lead
- Downloads from Facebook URLs
- Uploads to storage
- Returns download status

**POST /api/messages/generate**
- Now contextual by lead type
- OWNER leads → WhatsApp/Messenger templates
- CLIENT leads → Facebook comment template

---

### 5. **Updated UI Components** 🎨

#### New Components:

**LeadTypeToggle.tsx**
- Tab switcher for OWNER/CLIENT views
- Filters dashboard by lead type

**LeadTypeBadge.tsx**
- Visual indicator (OWNER/CLIENT)
- Color-coded badges

**ImageGallery.tsx**
- Displays downloaded images
- Shows "Download Images" button if not downloaded
- Triggers download on click

**ImageDownloadButton.tsx**
- Standalone button to trigger download
- Shows loading state during download
- Displays success/error messages

#### Modified Components:

**StatsCards.tsx**
- Now shows stats per lead type
- Separate counts for OWNER and CLIENT

**LeadCard.tsx**
- Shows lead type badge
- Shows image thumbnail (if downloaded)
- Intent score only for OWNER leads

**MessagePreview.tsx**
- Contextual templates by lead type
- Different preview for CLIENT leads (comment)

**SendButtons.tsx**
- WhatsApp/Messenger for OWNER leads
- Facebook comment button for CLIENT leads

---

### 6. **Updated Scraper Logic** 🤖

#### New Scraper Features:

**Lead Classification**
```javascript
// AI classifies each post as OWNER or CLIENT
const leadType = await classifyLead(postContent);

if (leadType === 'OWNER') {
  // Check for agent, score intent
  const isAgent = await detectAgent(authorId);
  if (isAgent) return; // Skip agents
  
  const intentScore = await scoreIntent(postContent);
  // Save with OWNER type
} else if (leadType === 'CLIENT') {
  // No agent check, no scoring
  // Save with CLIENT type
}
```

**Image URL Extraction**
```javascript
// Extract image URLs (do NOT download)
const imageUrls = await extractImageUrls(postElement);

// Store as JSON array
await saveLead({
  // ... other fields ...
  imageUrls: JSON.stringify(imageUrls),
  imagesDownloaded: false
});
```

---

### 7. **Updated Environment Variables** ⚙️

#### New Variables in `.env.example`:

```bash
# Lead types to scrape
SCRAPER_LEAD_TYPES="OWNER,CLIENT"

# Image handling
SCRAPER_EXTRACT_IMAGE_URLS="true"
SCRAPER_AUTO_DOWNLOAD_IMAGES="false"

# Supabase Storage (for images)
SUPABASE_STORAGE_BUCKET="lead-images"
```

---

## 📊 Updated Workflow

### OWNER Lead Workflow:
```
Facebook Post (Property for Rent)
    ↓
Scraper extracts data + image URLs
    ↓
AI classifies as OWNER
    ↓
AI checks if agent (>5 posts)
    ↓
AI scores intent (1-10)
    ↓
Save to database (imageUrls as JSON)
    ↓
User reviews in dashboard
    ↓
User approves → Download images
    ↓
Generate personalized message
    ↓
1-click send via WhatsApp/Messenger
```

### CLIENT Lead Workflow:
```
Facebook Post (Looking for Rental)
    ↓
Scraper extracts data + image URLs
    ↓
AI classifies as CLIENT
    ↓
Save to database (no scoring, no agent check)
    ↓
User reviews in dashboard
    ↓
User approves → Download images
    ↓
Generate comment: "Contact for options"
    ↓
1-click post comment on Facebook
```

---

## 🎯 Key Benefits of Updates

### 1. **Dual Lead Types**
- ✅ Maximizes business opportunities (both owners and clients)
- ✅ Different strategies for different lead types
- ✅ More efficient use of agent's time

### 2. **On-Demand Images**
- ✅ Saves storage costs (only approved leads)
- ✅ Faster scraping (no download overhead)
- ✅ Prevents database bloat
- ✅ User control over storage usage

### 3. **Contextual Messaging**
- ✅ OWNER leads get personalized outreach
- ✅ CLIENT leads get simple comment
- ✅ Appropriate for each lead type

---

## 📝 Updated File Structure

### New Files:
```
components/
├── dashboard/
│   └── LeadTypeToggle.tsx       # NEW
├── leads/
│   ├── ImageGallery.tsx         # NEW
│   ├── ImageDownloadButton.tsx  # NEW
│   └── LeadTypeBadge.tsx        # NEW

lib/
├── services/
│   └── imageService.ts          # NEW
├── repositories/
│   └── imageRepository.ts       # NEW
└── utils/
    └── leadClassifier.ts        # NEW

scraper/src/
├── services/
│   └── imageExtractor.ts        # NEW
└── config/
    ├── ownerKeywords.ts         # NEW
    └── clientKeywords.ts        # NEW
```

### Modified Files:
- ✅ `memory-bank/projectbrief.md` - Added dual lead types
- ✅ `memory-bank/productContext.md` - Added CLIENT workflows
- ✅ `memory-bank/systemPatterns.md` - Added image strategy
- ✅ `memory-bank/techContext.md` - Updated schema
- ✅ `memory-bank/progress.md` - Updated all phases
- ✅ `memory-bank/activeContext.md` - Added new decisions
- ✅ `.clinerules` - Added lead type patterns
- ✅ `.env.example` - Added image and lead type configs
- ✅ `PROJECT_STRUCTURE.md` - Updated structure

---

## ✅ Ready to Proceed

All memory bank files have been updated with:
- ✅ Dual lead type system (OWNER/CLIENT)
- ✅ Image download strategy (on-demand)
- ✅ Updated database schema
- ✅ Updated API routes
- ✅ Updated UI components
- ✅ Updated scraper logic
- ✅ Updated environment variables

**Next Step**: Initialize Next.js project and start Phase 1 (Database & Authentication)

---

**Say "Let's start Phase 1" when ready to begin implementation!** 🚀
