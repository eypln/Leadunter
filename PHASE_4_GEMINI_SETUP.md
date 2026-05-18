# Phase 4: AI Message Generation with Google Gemini

## Overview
Phase 4 implements AI-powered message generation using Google Gemini API. This replaces template-based messages with personalized, context-aware messages for OWNER leads.

## What's New

### 1. Google Gemini Integration ✅
- **Package**: `@google/generative-ai`
- **Model**: `gemini-1.5-flash` (fast and free)
- **Features**:
  - Personalized message generation for OWNER leads
  - Lead type classification (OWNER vs CLIENT)
  - Intent score analysis (1-10)
  - Agent detection

### 2. AI-Powered Message Generation ✅
- **OWNER Leads**: 
  - AI generates personalized messages based on listing details
  - Adapts tone and content to WhatsApp or Messenger
  - Includes property details, location, and price
  - Natural, conversational language
  - Fallback to template if API fails
  
- **CLIENT Leads**: 
  - Simple template: "Contact for options"
  - No AI needed for client responses

### 3. 1-Click Send Integration ✅
- **WhatsApp**: Opens WhatsApp with pre-filled message (if phone found)
- **Messenger**: Opens Facebook Messenger with pre-filled message (if no phone)
- **Facebook Comment**: Opens Facebook post for CLIENT leads
- Deep links work on both desktop and mobile

## Setup Instructions

### Step 1: Get Gemini API Key

1. **Visit Google AI Studio**
   - Go to: https://aistudio.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key**
   - Click "Create API Key"
   - Select your Google Cloud project (or create new)
   - Copy the generated API key

3. **Add to Environment**
   - Open `.env.local` file
   - Add: `GEMINI_API_KEY="your-api-key-here"`
   - Save the file

### Step 2: Verify Installation

```bash
# Check if package is installed
npm list @google/generative-ai

# Should show: @google/generative-ai@0.x.x
```

### Step 3: Test the Implementation

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Login to Dashboard**
   - Navigate to http://localhost:3000
   - Login with Facebook

3. **Test Message Generation**
   - Click on any OWNER lead
   - Click "Generate Message" button
   - Wait for AI to generate personalized message
   - Verify message is contextual and natural
   - Click "Send via WhatsApp" or "Send via Messenger"
   - Verify it opens the correct app with pre-filled message

4. **Test CLIENT Lead**
   - Click on any CLIENT lead
   - Click "Generate Message" button
   - Verify it shows "Contact for options"
   - Click "Comment on Facebook Post"
   - Verify it opens Facebook post

## Features Implemented

### GeminiService Class
**Location**: `lib/ai/gemini-service.ts`

**Methods**:
1. `generateOwnerMessage()` - AI-powered personalized messages
2. `generateClientMessage()` - Simple template for clients
3. `analyzeIntentScore()` - Score lead quality (1-10)
4. `detectAgent()` - Identify if author is an agent
5. `classifyLeadType()` - Classify as OWNER or CLIENT

### API Route Updates
**Location**: `app/api/messages/generate/route.ts`

**Changes**:
- Integrated GeminiService
- AI generation for OWNER leads
- Template for CLIENT leads
- Error handling with fallback

### UI Enhancements
**Location**: `components/lead-detail/lead-detail-modal.tsx`

**New Features**:
- 1-Click WhatsApp button (OWNER + phone)
- 1-Click Messenger button (OWNER + no phone)
- Facebook comment button (CLIENT)
- Deep links with pre-filled messages
- Visual distinction between send methods

## Message Generation Flow

```
User clicks "Generate Message"
         ↓
API receives leadId
         ↓
Fetch lead from database
         ↓
Check lead type
         ↓
    ┌────┴────┐
    ↓         ↓
  OWNER    CLIENT
    ↓         ↓
Gemini AI  Template
    ↓         ↓
Personalized  "Contact for options"
    ↓         ↓
    └────┬────┘
         ↓
Return message to UI
         ↓
Display with 1-click send button
```

## Gemini API Prompts

### Owner Message Generation
```
You are a professional real estate letting specialist at QL Prime/Quicklets in Malta.

Generate a personalized [WhatsApp/Messenger] message to contact a property owner.

LISTING DETAILS:
- Title, Description, Owner Name, Location, Price

REQUIREMENTS:
1. Address owner by name
2. Professional but warm
3. Mention QL Prime/Quicklets
4. Explain service (find reliable tenants)
5. Concise (3-4 sentences)
6. Natural, conversational tone
7. Include contact info
```

### Intent Score Analysis
```
Analyze this rental listing and score the likelihood that this is a genuine property owner (not an agent) on a scale of 1-10.

SCORING CRITERIA:
- 9-10: Very likely direct owner
- 7-8: Likely owner
- 5-6: Uncertain
- 3-4: Likely agent
- 1-2: Definitely agent
```

### Agent Detection
```
Determine if the author is a real estate agent or agency.

AGENT INDICATORS:
- Agency name, commission, professional service
- Multiple properties, business tone

OWNER INDICATORS:
- Personal language, single property
- Casual tone, direct owner mentions
```

## Cost & Performance

### Gemini API Pricing
- **Free Tier**: 15 requests per minute
- **Cost**: FREE for moderate usage
- **Rate Limits**: 1,500 requests per day (free)

### Performance
- **Response Time**: 1-3 seconds per message
- **Fallback**: Template-based if API fails
- **Caching**: Not implemented yet (future enhancement)

## Testing Checklist

- [ ] Gemini API key added to `.env.local`
- [ ] Dev server starts without errors
- [ ] Generate message works for OWNER leads
- [ ] Messages are personalized and natural
- [ ] Generate message works for CLIENT leads
- [ ] WhatsApp button opens with pre-filled message
- [ ] Messenger button opens with pre-filled message
- [ ] Facebook comment button opens post
- [ ] Copy to clipboard works
- [ ] Fallback template works if API fails
- [ ] No TypeScript errors
- [ ] No console errors

## Troubleshooting

### Error: "GEMINI_API_KEY is not defined"
**Solution**: Add API key to `.env.local` and restart dev server

### Error: "Failed to generate message"
**Solution**: 
1. Check API key is valid
2. Check internet connection
3. Verify Gemini API is not rate limited
4. Check browser console for detailed error

### Message is not personalized
**Solution**: 
1. Verify lead has complete data (title, description)
2. Check Gemini API response in server logs
3. Try regenerating the message

### WhatsApp/Messenger link doesn't work
**Solution**:
1. Verify phone number format (international format)
2. Check author_id is correct for Messenger
3. Test on mobile device (deep links work better on mobile)

## Future Enhancements

### Phase 4.1: Advanced Features
- [ ] Message regeneration with different tone
- [ ] Message editing before sending
- [ ] Save generated messages to database
- [ ] Message performance tracking
- [ ] A/B testing different message styles

### Phase 4.2: Optimization
- [ ] Cache generated messages
- [ ] Batch message generation
- [ ] Rate limiting handling
- [ ] Retry logic for failed requests

### Phase 4.3: Analytics
- [ ] Track message open rates
- [ ] Track response rates
- [ ] Analyze best-performing messages
- [ ] AI learning from successful messages

## Files Modified

1. `lib/ai/gemini-service.ts` - Created (Gemini AI service)
2. `app/api/messages/generate/route.ts` - Updated (AI integration)
3. `components/lead-detail/lead-detail-modal.tsx` - Updated (1-click send)
4. `.env.example` - Updated (Gemini API key)
5. `package.json` - Updated (@google/generative-ai)
6. `PHASE_4_GEMINI_SETUP.md` - Created (this file)

## Next Steps

After Phase 4 is complete and tested:
1. Update memory bank files
2. Test with real leads
3. Gather feedback on message quality
4. Move to Phase 5: Scraper Foundation

---

**Implementation Date**: May 19, 2026
**Phase**: Phase 4 - AI Message Generation
**Status**: Ready for testing
**AI Provider**: Google Gemini (gemini-1.5-flash)
