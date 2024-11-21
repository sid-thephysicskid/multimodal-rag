// src/app/api/decide-and-respond/route.ts
import { NextResponse } from 'next/server';
import { generateChatResponse, generateSpeech } from '@/lib/openai';
import { CHAT_PROMPT_TEMPLATES } from '@/lib/openai';
import { Action, VerbalResponse } from '@/types/actions';
import { GroundX } from '@/lib/groundx';

const groundx = new GroundX({
  apiKey: process.env.GROUNDX_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { text, context } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text input is required' },
        { status: 400 }
      );
    }

    // Parse action using GPT-4
    const actionResponse = await generateChatResponse(
      CHAT_PROMPT_TEMPLATES.actionParse,
      `my name is doc tech, what action would you like me to perform?\n\nUser: ${text}`
    );
    
    const action: Action = JSON.parse(actionResponse as string);
    action.query = text;
    action.context = context;
    action.does_follow_up = false;

    // Generate verbal response
    const verbalResponseJson = await generateChatResponse(
      CHAT_PROMPT_TEMPLATES.verbalResponse,
      `User Query: ${text}\nSystem Action: ${JSON.stringify(action)}`
    );
    
    const verbalResponse: VerbalResponse = JSON.parse(verbalResponseJson as string);
    
    // Generate speech
    const speechResponse = await generateSpeech(verbalResponse.immediate_response);
    
    // Convert speech to blob URL
    const audioBuffer = await speechResponse.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    
    action.does_follow_up = verbalResponse.followup_response;

    return NextResponse.json({
      audio: audioBlob,
      plan: action
    });
  } catch (error) {
    console.error('Error in decide-and-respond:', error);
    return NextResponse.json(
      { error: 'Failed to process request' }, 
      { status: 500 }
    );
  }
}