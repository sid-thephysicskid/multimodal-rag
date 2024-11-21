// src/app/api/execute-plan/route.ts
import { NextResponse } from 'next/server';
import { generateChatResponse, generateSpeech } from '@/lib/openai';
import { GroundX } from '@/lib/groundx';
import { Action } from '@/types/actions';

const groundx = new GroundX({
  apiKey: process.env.GROUNDX_API_KEY!,
});

const BUCKET_ID = process.env.GROUNDX_BUCKET_ID!;

export async function POST(request: Request) {
  try {
    const plan: Action = await request.json();
    let response: Action = { ...plan };
    let ragContext = '';

    if (plan.find_fig) {
      const searchResult = await groundx.searchContent(BUCKET_ID, plan.query!);
      const firstResult = searchResult.body.search.results[0];
      response.pdf = firstResult.sourceUrl;
      response.page = firstResult.boundingBoxes[0].pageNumber;
      ragContext = searchResult.body.search.text;
    } else if (plan.find_pdf) {
      const searchResult = await groundx.searchContent(BUCKET_ID, plan.query!);
      response.pdf = searchResult.body.search.results[0].sourceUrl;
      ragContext = searchResult.body.search.text;
    }

    if (plan.does_follow_up && ragContext) {
      const verbalResponsePrompt = `A user has a query which has triggered a process to look up data which should be relevent to that query.
        The relevent data is included below. Use this data to answer the users question. Say things like "from this document"
        and "on page __".

        If the data does not answer the question, tell the user you're not sure but they might find their answer in the document below.

        === lookup data relevent to query ===
        ${ragContext}`;

      const followupResponse = await generateChatResponse(
        verbalResponsePrompt,
        plan.query!
      );

      const speechResponse = await generateSpeech(followupResponse as string);
      const audioBuffer = await speechResponse.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });

      return NextResponse.json({
        ...response,
        followup_audio: audioBlob
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error executing plan:', error);
    return NextResponse.json(
      { error: 'Failed to execute plan' }, 
      { status: 500 }
    );
  }
}