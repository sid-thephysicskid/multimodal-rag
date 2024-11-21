// src/app/page.tsx
'use client';

import { useState } from 'react';
import { AudioRecorder } from '@/components/audio-recorder';
import { PdfViewer } from '@/components/pdf-viewer';
import { Action } from '@/types/actions';

export default function Home() {
  const [apiResponse, setApiResponse] = useState<Action>({});

  const handleApiResponse = (response: Action) => {
    setApiResponse(response);
  };

  return (
    <main className="container mx-auto p-4 min-h-screen">
      <div className="flex flex-col items-center gap-8">
        <div className="w-full max-w-md">
          <AudioRecorder onApiResponse={handleApiResponse} />
        </div>
        <div className="w-full">
          <PdfViewer apiResponse={apiResponse} />
        </div>
      </div>
    </main>
  );
}