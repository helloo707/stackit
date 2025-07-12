import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      GEMINI_API_KEY_LENGTH: process.env.GEMINI_API_KEY?.length || 0,
      GEMINI_API_KEY_PREFIX: process.env.GEMINI_API_KEY?.substring(0, 5) || 'N/A',
      GEMINI_API_KEY_FULL: process.env.GEMINI_API_KEY || 'N/A', // <-- Show the API key here
      NODE_ENV: process.env.NODE_ENV,
    };

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        error: 'GEMINI_API_KEY not found',
        environment: envCheck,
        timestamp: new Date().toISOString(),
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Test different models
    const models = ['gemini-2.0-flash'];
    const testResults = [];

    for (const model of models) {
      try {
        const testContent = "Authentication is a security process that verifies user identity.";
        
        const contents = [
          {
            role: 'user',
            parts: [
              {
                text: `Explain this in simple terms: ${testContent}`,
              },
            ],
          },
        ];

        const response = await ai.models.generateContent({
          model,
          contents,
        });

        testResults.push({
          model,
          success: true,
          response: response.text?.substring(0, 100) + '...',
          error: null,
        });
      } catch (error) {
        testResults.push({
          model,
          success: false,
          response: null,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      modelTests: testResults,
      recommendations: testResults.some(r => r.success) 
        ? 'At least one model is working'
        : 'All models failed - check API key validity',
    });
  } catch (error) {
    console.error('Gemini debug endpoint error:', error);
    return NextResponse.json({
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 