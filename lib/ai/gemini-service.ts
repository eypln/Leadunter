import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AgentDecision } from '@/lib/scraper/lead-filter';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export class GeminiService {
  private model;

  constructor(modelName: string = 'gemini-1.5-pro') {
    this.model = genAI.getGenerativeModel({ model: modelName });
  }

  /**
   * Generate personalized message for OWNER leads
   */
  async generateOwnerMessage(lead: {
    title: string;
    description: string;
    author_name: string;
    location?: string;
    phone?: string;
    price?: number;
  }): Promise<string> {
    const hasPhone = !!lead.phone;
    const templateType = hasPhone ? 'WhatsApp' : 'Messenger';

    const prompt = `You are Erhan, a professional letting specialist at QL Prime/Quicklets in Malta.

Generate a HIGHLY PERSONALIZED ${templateType} message to contact this property owner.

PROPERTY LISTING:
Title: ${lead.title}
Description: ${lead.description}
Owner: ${lead.author_name}
Location: ${lead.location || 'Malta'}
${lead.price ? `Monthly Rent: €${lead.price}` : ''}
${hasPhone ? `Contact Method: WhatsApp` : `Contact Method: Facebook Messenger`}

CRITICAL REQUIREMENTS:
1. Start with "Hi ${lead.author_name}," (use EXACT name, no Mr/Ms unless it sounds natural)
2. Reference SPECIFIC details from their listing (location, features, price range)
3. Show you actually READ their post - mention something unique about their property
4. Keep it conversational and warm, NOT robotic or templated
5. Explain briefly: "I help landlords find reliable long-term tenants with a hassle-free process"
6. Keep it SHORT (3-4 sentences max)
7. End with: "Looking forward to working together. Best regards, Erhan"
${hasPhone ? '8. Mention WhatsApp contact: +35699690055' : '8. Mention WhatsApp for follow-up: +35699690055'}
9. VARY your opening - don't always say "I hope you're doing well"
10. Make each message UNIQUE - avoid repetitive phrases

EXAMPLES OF GOOD PERSONALIZATION:
- "I noticed your apartment in Sliema has a sea view - that's a great selling point!"
- "Your €1,200 price point is very competitive for that area"
- "The fully furnished aspect will definitely attract quality tenants"

Generate ONLY the message text. Make it sound like a real person wrote it, not AI.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return text.trim();
    } catch (error) {
      console.error('Gemini API error:', error);
      // Fallback to template
      return this.getFallbackOwnerMessage(lead, hasPhone);
    }
  }

  /**
   * Generate message for CLIENT leads (AI-powered, simple and safe)
   */
  async generateClientMessage(lead: {
    title: string;
    description: string;
    author_name: string;
    location?: string;
    price?: number;
  }): Promise<string> {
    const prompt = `You are a friendly real estate agent at QL Prime/Quicklets in Malta.

Generate a VERY SHORT, safe, and friendly Facebook comment to respond to someone looking for a rental.

CLIENT'S NAME: ${lead.author_name}

CRITICAL REQUIREMENTS:
1. Start with "Hi ${lead.author_name}!" (use their ACTUAL name)
2. Keep it EXTREMELY SHORT (1 sentence only)
3. Be friendly and inviting
4. DO NOT mention specific locations, budgets, or dates (to avoid misunderstandings)
5. Keep it general and safe - just invite them to contact you
6. Sound warm and helpful, like a real person
7. VARY your responses - use different phrases each time

GOOD EXAMPLES:
- "Hi Sarah! We'd love to help you find the perfect place. Feel free to reach out!"
- "Hey John! Let's chat about what you're looking for. Happy to help!"
- "Hi Maria! We have some great options available. Let's connect!"
- "Hey Alex! I can definitely help with your search. Feel free to message me!"
- "Hi Emma! Would love to help you find something perfect. Let's talk!"

BAD EXAMPLES (avoid these):
- Mentioning specific locations: "in Sliema" (they might want St. Julians)
- Mentioning budget: "within your budget" (might change)
- Mentioning dates: "for September" (might be flexible)
- Being too specific: "1-bedroom options" (might want 2-bedroom)

Generate ONLY the comment text. Keep it simple, friendly, and general.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return text.trim();
    } catch (error) {
      console.error('Gemini API error:', error);
      // Fallback to simple template
      return `Hi ${lead.author_name}! We'd love to help you find the perfect place. Feel free to reach out!`;
    }
  }

  /**
   * Analyze lead intent score (for OWNER leads)
   */
  async analyzeIntentScore(lead: {
    title: string;
    description: string;
    author_name: string;
  }): Promise<number> {
    const prompt = `Analyze this rental property listing and score the likelihood that this is a genuine property owner (not an agent) on a scale of 1-10.

LISTING:
Title: ${lead.title}
Description: ${lead.description}
Author: ${lead.author_name}

SCORING CRITERIA:
- 9-10: Very likely direct owner (personal language, single property, mentions "my apartment", "owner direct")
- 7-8: Likely owner (casual tone, specific details, no agency language)
- 5-6: Uncertain (could be owner or agent)
- 3-4: Likely agent (professional language, multiple properties mentioned)
- 1-2: Definitely agent (agency name, commission mentioned, business tone)

Respond with ONLY a single number from 1-10, nothing else.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      const score = parseInt(text);
      
      if (isNaN(score) || score < 1 || score > 10) {
        return 5; // Default middle score
      }
      
      return score;
    } catch (error) {
      console.error('Gemini API error:', error);
      return 5; // Default middle score
    }
  }

  /**
   * Detect if author is an agent (for OWNER leads)
   */
  async detectAgent(lead: {
    title: string;
    description: string;
    author_name: string;
  }): Promise<AgentDecision> {
    const prompt = `Analyze this rental property listing and determine if the author is a real estate agent or agency.

LISTING:
Title: ${lead.title}
Description: ${lead.description}
Author: ${lead.author_name}

AGENT INDICATORS:
- Agency name in author or description
- Words like: "agency", "commission", "professional service", "licensed agent"
- Multiple properties mentioned
- Business-like professional tone
- Contact information for a company

OWNER INDICATORS:
- Personal language ("my apartment", "our property")
- Single property focus
- Casual, conversational tone
- Direct owner mentions

  Respond with ONLY one of these values: AGENT, DIRECT_OWNER, or UNKNOWN.
  Use UNKNOWN if the evidence is insufficient. Do not guess. No other text.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim().toUpperCase();

      if (text === 'AGENT' || text === 'DIRECT_OWNER' || text === 'UNKNOWN') {
        return text as AgentDecision;
      }

      return 'UNKNOWN';
    } catch (error) {
      console.error('Gemini API error:', error);
      return 'UNKNOWN';
    }
  }

  /**
   * Classify lead type (OWNER vs CLIENT)
   */
  async classifyLeadType(lead: {
    title: string;
    description: string;
  }): Promise<'OWNER' | 'CLIENT'> {
    const prompt = `Classify this Facebook post as either an OWNER (property owner offering rental) or CLIENT (person looking to rent).

POST:
Title: ${lead.title}
Description: ${lead.description}

OWNER indicators:
- "for rent", "to let", "available", "apartment for rent"
- Describes a property they own
- Lists amenities, price, location details

CLIENT indicators:
- "looking for", "need apartment", "searching for", "want to rent"
- Describes what they're looking for
- Budget, preferences, move-in date

Respond with ONLY "OWNER" or "CLIENT", nothing else.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim().toUpperCase();
      
      if (text === 'OWNER' || text === 'CLIENT') {
        return text as 'OWNER' | 'CLIENT';
      }
      
      // Fallback: keyword-based classification
      const lowerText = (lead.title + ' ' + lead.description).toLowerCase();
      if (lowerText.includes('looking for') || lowerText.includes('need apartment') || lowerText.includes('searching for')) {
        return 'CLIENT';
      }
      return 'OWNER';
    } catch (error) {
      console.error('Gemini API error:', error);
      // Fallback: keyword-based classification
      const lowerText = (lead.title + ' ' + lead.description).toLowerCase();
      if (lowerText.includes('looking for') || lowerText.includes('need apartment') || lowerText.includes('searching for')) {
        return 'CLIENT';
      }
      return 'OWNER';
    }
  }

  /**
   * Fallback template for OWNER messages
   */
  private getFallbackOwnerMessage(
    lead: { author_name: string; phone?: string; location?: string; price?: number },
    hasPhone: boolean
  ): string {
    if (hasPhone) {
      return `Hi ${lead.author_name},

I came across your property listing${lead.location ? ` in ${lead.location}` : ''}${lead.price ? ` (€${lead.price}/mo)` : ''} and wanted to reach out. I'm Erhan from QL Prime, and I specialize in helping landlords find reliable, long-term tenants with a hassle-free process.

If you're interested in our service, feel free to reach out at +35699690055.

Looking forward to working together.
Best regards, Erhan`;
    } else {
      return `Hi ${lead.author_name},

I came across your property listing${lead.location ? ` in ${lead.location}` : ''}${lead.price ? ` (€${lead.price}/mo)` : ''} and wanted to reach out. I'm Erhan from Quicklets, and I specialize in helping landlords find reliable, long-term tenants with a hassle-free process.

If you're interested, we'd be happy to answer any questions via WhatsApp at +35699690055.

Looking forward to working together.
Best regards, Erhan`;
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
