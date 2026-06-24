'use client';

import { useState, useEffect } from 'react';
import type { ProductData, AssetSelection, VideoScript } from '@/lib/types';
import { generateVideo } from '@/lib/video/generator';
import { VideoPlayer } from '../preview/video-player';

interface VideoGeneratorProps {
  productData: ProductData;
  assets: AssetSelection;
  onComplete: (videoUrl: string) => void;
}

export function VideoGenerator({ productData, assets, onComplete }: VideoGeneratorProps) {
  const [stage, setStage] = useState<string>('Initializing...');
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<VideoScript | null>(null);

  useEffect(() => {
    startGeneration();
  }, []);

  const startGeneration = async () => {
    try {
      setStage('Generating script...');
      setProgress(10);

      const scriptRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productData, assets }),
      });

      if (!scriptRes.ok) throw new Error('Failed to generate script');

      const { script: generatedScript } = await scriptRes.json();
      setScript(generatedScript);
      setProgress(20);

      if (!assets.backgroundVideo) {
        throw new Error('No background video selected');
      }

      const videoBlob = await generateVideo({
        backgroundVideo: assets.backgroundVideo,
        gif: assets.gif,
        audio: assets.audio,
        script: generatedScript,
        onProgress: (s, p) => {
          setStage(s);
          setProgress(20 + Math.round(p * 0.7));
        },
      });

      setProgress(95);
      setStage('Finalizing...');

      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      setProgress(100);
      setStage('Complete!');
      onComplete(url);
    } catch (err) {
      console.error('Video generation error:', err);
      setError(err instanceof Error ? err.message : 'Video generation failed');
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-4">
        <p className="text-red-800 dark:text-red-200 font-medium">Generation Failed</p>
        <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
        <button
          onClick={startGeneration}
          className="mt-3 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (videoUrl) {
    return (
      <div className="space-y-4">
        <VideoPlayer src={videoUrl} />
        {script && (
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 space-y-2">
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Script</h4>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <p><strong>Hook:</strong> {script.hook}</p>
              <p><strong>Body:</strong> {script.body}</p>
              <p><strong>CTA:</strong> {script.cta}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">{stage}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            This may take a minute...
          </p>
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{progress}%</p>
      </div>
    </div>
  );
}
