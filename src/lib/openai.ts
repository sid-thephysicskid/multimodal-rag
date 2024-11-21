// src/lib/openai.ts
import OpenAI from 'openai';
if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// First, define an interface for the templates
interface ChatPromptTemplates {
  actionParse: string;
  verbalResponse: string;
}

// // Then type the constant with the interface
// export const CHAT_PROMPT_TEMPLATES: ChatPromptTemplates = {
//   actionParse: `Decide if the user wants one of the following actions performed:
//   - 'scroll_up': scroll up a small amount within one page of the pdf
//   - 'scroll_down': scroll down a small amount within one page of the pdf
//   - 'snap_page': snap to a specific page of a pdf
//   - 'find_fig': find a specific figure, table, image, or specific item.
//   - 'find_doc': find a specific doc
//   - 'non_determ': no valid action is discernable
//   The values above are mutually exclusive. One should be true, the rest should be false.
//   note: you can use snap_page to go to a page relative to the current page.
//   note: blanket questions should default to find figure, unless they're obviously about a document.
//   note: if a user asks a general question, assume it's from a figure and try to find a relevent figure.`,

//   verbalResponse: `You will be given a user's query, and the actions a system decided to take based on that query.
//   respond to the user verbally with an "immediate_response", informing them what action will be taken. Be breif and conversational.
//   This is powered by GroundX, which is a retreival engine designed to work with complex real world documents.
//   If the user asks about GroundX, tell them they use a computer vision based parsing system, trained on a large amount of corperate documents to understand documents. GroundX can run in the cloud, on prem, whatever.`
// };
export const CHAT_PROMPT_TEMPLATES: ChatPromptTemplates = {
    actionParse: `Decide if the user wants one of the following actions performed:
    - 'scroll_up': scroll up a small amount within one page of the pdf
    - 'scroll_down': scroll down a small amount within one page of the pdf
    - 'snap_page': snap to a specific page of a pdf
    - 'find_fig': find a specific figure, table, image, or specific item.
    - 'find_doc': find a specific doc
    - 'non_determ': no valid action is discernable
    The values above are mutually exclusive. One should be true, the rest should be false.
    note: you can use snap_page to go to a page relative to the current page.
    note: blanket questions should default to find figure, unless they're obviously about a document.
    note: if a user asks a general question, assume it's from a figure and try to find a relevant figure.`,
  
    verbalResponse: `You will be given a user's query, and the actions a system decided to take based on that query.
    Respond to the user verbally with an "immediate_response", informing them what action will be taken. Be brief and conversational.
    This is powered by GroundX, which is a retrieval engine designed to work with complex real-world documents.
    If the user asks about GroundX, tell them they use a computer vision-based parsing system, trained on a large amount of corporate documents to understand documents. GroundX can run in the cloud, on-prem, or anywhere.`,
  };
export async function generateChatResponse(prompt: string, userMessage: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: userMessage }
    ],
    temperature: 0,
  });

  return response.choices[0].message.content;
}

export async function transcribeAudio(audioFile: File) {
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
  });

  return transcription.text;
}

export async function generateSpeech(text: string) {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "alloy",
    input: text,
  });

  return mp3;
}