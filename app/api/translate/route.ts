import { NextRequest, NextResponse } from 'next/server';
// We'll use the 'https' module for making our own request to Google Translate API
import https from 'https';
import querystring from 'querystring';

// Define types for the Google Translate API response
type TranslationPart = [string | null, string | null, string | null, string | null];
type TranslationResponse = [TranslationPart[] | null, unknown[]?];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLanguage = 'en' } = body;
    
    if (!text) {
      return NextResponse.json({ error: 'Missing required text parameter' }, { status: 400 });
    }
    
    // Use a simple implementation to call Google Translate
    const translatedText = await translateText(text, targetLanguage);
    
    return NextResponse.json({
      translatedText,
      from: 'auto', // Auto-detected
      to: targetLanguage
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Failed to translate text' }, { status: 500 });
  }
}

// Helper function to translate text
function translateText(text: string, targetLang: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // For a simple implementation, we'll use the free Google Translate API
    // Note: For production use, you should consider using official Google Cloud Translation API
    const apiUrl = 'https://translate.googleapis.com/translate_a/single';
    
    const params = {
      client: 'gtx',
      sl: 'auto',
      tl: targetLang,
      dt: 't',
      q: text
    };
    
    const url = `${apiUrl}?${querystring.stringify(params)}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Parse the response
          const translatedParts = JSON.parse(data) as TranslationResponse;
          let translatedText = '';
          
          // Extract translation from response format
          if (translatedParts && translatedParts[0]) {
            translatedText = translatedParts[0]
              .filter((part): part is TranslationPart => part !== null && part[0] !== null)
              .map((part) => part[0] as string)
              .join('');
          }
          
          resolve(translatedText);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}