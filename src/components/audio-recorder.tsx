// src/components/audio-recorder.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Action } from '@/types/actions';

interface AudioRecorderProps {
  onApiResponse: (response: Action) => void;
}

export function AudioRecorder({ onApiResponse }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for audio handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  // Refs for visualization
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Silence detection
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const SILENCE_THRESHOLD = 0.05;
  const SILENCE_DURATION = 1000; // 1 second of silence before auto-stop

  useEffect(() => {
    // Cleanup function
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  async function startRecording() {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context and analyzer
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = handleStop;
      mediaRecorderRef.current.start();
      setIsRecording(true);
      startVisualizer();

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please check your microphone permissions.');
      setIsRecording(false);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    }
  }

  async function handleStop() {
    setIsProcessing(true);
    try {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/ogg; codecs=opus' });
      const formData = new FormData();
      formData.append('audio', audioBlob);

      // Step 1: Transcribe
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!transcribeResponse.ok) {
        throw new Error('Transcription failed');
      }
      
      const transcribeData = await transcribeResponse.json();

      // Step 2: Get action plan and initial response
      const decideResponse = await fetch('/api/decide-and-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcribeData.text,
          context: { current_page: 1 }
        }),
      });

      if (!decideResponse.ok) {
        throw new Error('Failed to process request');
      }

      const decideData = await decideResponse.json();

      // Play initial audio response
      if (decideData.audio) {
        const audioUrl = URL.createObjectURL(decideData.audio);
        const audio = new Audio(audioUrl);
        await audio.play();
        URL.revokeObjectURL(audioUrl);
      }

      // Step 3: Execute plan
      if (decideData.plan) {
        const executeResponse = await fetch('/api/execute-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(decideData.plan),
        });

        if (!executeResponse.ok) {
          throw new Error('Failed to execute plan');
        }

        const executeData = await executeResponse.json();

        // Play follow-up audio if available
        if (executeData.followup_audio) {
          const followupUrl = URL.createObjectURL(executeData.followup_audio);
          const followupAudio = new Audio(followupUrl);
          await followupAudio.play();
          URL.revokeObjectURL(followupUrl);
        }

        onApiResponse(executeData);
      }

    } catch (error) {
      console.error('Error in audio processing:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  }

  function startVisualizer() {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!analyserRef.current) return;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate RMS (Root Mean Square) for volume level
      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        sumSquares += (dataArray[i] / 255) ** 2;
      }
      const rms = Math.sqrt(sumSquares / bufferLength);

      // Draw visualization
      const radius = isRecording ? Math.max(10, rms * 100) : 10;
      
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isRecording ? 'rgba(0, 150, 255, 0.8)' : 'rgba(200, 200, 200, 0.2)';
      ctx.fill();

      // Auto-stop on silence
      if (isRecording && rms < SILENCE_THRESHOLD) {
        if (!silenceTimeoutRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            stopRecording();
          }, SILENCE_DURATION);
        }
      } else if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <div className="text-red-500 text-sm mb-2">
          {error}
        </div>
      )}
      
      <Button 
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        variant={isRecording ? "destructive" : "default"}
        className="w-40 h-12"
      >
        {isProcessing ? 'Processing...' : isRecording ? 'Stop Recording' : 'Start Recording'}
      </Button>
      
      <canvas 
        ref={canvasRef} 
        width={200} 
        height={200}
        className="rounded-full bg-black shadow-lg"
      />
      
      {isProcessing && (
        <div className="text-sm text-gray-500">
          Processing your request...
        </div>
      )}
    </div>
  );
}