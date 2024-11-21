// src/components/pdf-viewer.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Action } from '@/types/actions';

interface PdfViewerProps {
  apiResponse: Partial<Action>;
}

export function PdfViewer({ apiResponse }: PdfViewerProps) {
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (apiResponse.pdf) {
      setCurrentPdfUrl(apiResponse.pdf);
      if (apiResponse.page) {
        setCurrentPage(apiResponse.page);
      }
    }

    handleApiResponse(apiResponse);
  }, [apiResponse]);

  const handleApiResponse = useCallback((response: Partial<Action>) => {
    setError(null);
    setIsLoading(true);

    try {
      if (response.scroll_up) {
        // Implement smooth scroll up
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.contentWindow?.scrollBy({
            top: -100,
            behavior: 'smooth'
          });
        }
      } else if (response.scroll_down) {
        // Implement smooth scroll down
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.contentWindow?.scrollBy({
            top: 100,
            behavior: 'smooth'
          });
        }
      } else if (response.next_page) {
        setCurrentPage(prev => prev + 1);
      } else if (response.previous_page) {
        setCurrentPage(prev => Math.max(1, prev - 1));
      } else if (response.snap_page && response.page) {
        setCurrentPage(response.page);
      }
    } catch (err) {
      console.error('Error handling PDF action:', err);
      setError('Failed to perform PDF action');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleManualPageChange = (increment: number) => {
    setCurrentPage(prev => Math.max(1, prev + increment));
  };

  if (!currentPdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] border rounded-lg bg-white">
        <p className="text-gray-500 mb-4">Ask a question!</p>
        <p className="text-sm text-gray-400">Use the microphone to ask about documents or figures</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="text-red-500 text-sm px-4">
          {error}
        </div>
      )}
      
      <div className="flex justify-center gap-4 mb-2">
        <Button
          onClick={() => handleManualPageChange(-1)}
          disabled={currentPage <= 1 || isLoading}
          variant="outline"
        >
          Previous Page
        </Button>
        <span className="flex items-center px-4 border rounded">
          Page {currentPage}
        </span>
        <Button
          onClick={() => handleManualPageChange(1)}
          disabled={isLoading}
          variant="outline"
        >
          Next Page
        </Button>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            Loading...
          </div>
        )}
        <iframe
          src={`${currentPdfUrl}#page=${currentPage}`}
          className="w-full h-[60vh] border rounded-lg"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError('Failed to load PDF');
            setIsLoading(false);
          }}
        />
      </div>
    </div>
  );
}