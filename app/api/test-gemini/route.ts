import { NextResponse } from 'next/server';
import { geminiService } from '@/lib/ai/gemini-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY not found in environment variables',
        message: 'Please add GEMINI_API_KEY to your .env.local file',
      });
    }

    // Test with a simple message generation
    const testLead = {
      title: 'Test Apartment for Rent',
      description: 'Beautiful 2-bedroom apartment in Sliema with sea view',
      author_name: 'Test Owner',
      location: 'Sliema',
      phone: '+35699123456',
      price: 1200,
    };

    console.log('Testing Gemini API with test lead...');
    const message = await geminiService.generateOwnerMessage(testLead);

    return NextResponse.json({
      success: true,
      message: 'Gemini API is working!',
      apiKeyFound: true,
      apiKeyLength: apiKey.length,
      generatedMessage: message,
      testLead,
    });
  } catch (error) {
    console.error('Gemini API test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
