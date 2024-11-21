// src/app/api/transcribe/route.ts
import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' }, 
        { status: 400 }
      );
    }

    const transcribedText = await transcribeAudio(audioFile);
    
    return NextResponse.json({ text: transcribedText });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Transcription failed' }, 
      { status: 500 }
    );
  }
}