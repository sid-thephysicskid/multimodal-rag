// src/app/api/speech/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/voice-id', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Speech synthesis failed');
    }

    const audioBlob = await response.blob();
    return new NextResponse(audioBlob, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (error) {
    console.error('Speech synthesis error:', error);
    return NextResponse.json({ error: 'Speech synthesis failed' }, { status: 500 });
  }
}