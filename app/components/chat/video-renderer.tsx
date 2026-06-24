'use client';

import { useEffect, useRef } from 'react';
import type { VideoComposition } from '@/lib/types/video';
import { generateVideo } from '@/lib/video/generator';

interface VideoRendererProps {
  composition: VideoComposition;
  onProgress: (stage: string, progress: number) => void;
  onComplete: (url: string) => void;
  onError: (error: string) => void;
}

export function VideoRenderer({ composition, onProgress, onComplete, onError }: VideoRendererProps) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const blob = await generateVideo(composition, onProgress);
        const url = URL.createObjectURL(blob);
        onComplete(url);
      } catch (err) {
        console.error('Render error:', err);
        onError(err instanceof Error ? err.message : 'Video rendering failed');
      }
    })();
  }, [composition, onProgress, onComplete, onError]);

  return null;
}
