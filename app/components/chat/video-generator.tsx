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

const PROCESSING_STAGES = [
  { key: 'init', verb: 'Initializing', description: 'Setting up video generator...' },
  { key: 'script', verb: 'Writing', description: 'Creating your video script...' },
  { key: 'loading', verb: 'Loading', description: 'Loading video processing engine...' },
  { key: 'downloading', verb: 'Downloading', description: 'Fetching your selected assets...' },
  { key: 'composing', verb: 'Composing', description: 'Assembling video layers...' },
  { key: 'rendering', verb: 'Rendering', description: 'Processing your UGC video...' },
  { key: 'finalizing', verb: 'Finalizing', description: 'Wrapping things up...' },
];

export function VideoGenerator({ productData, assets, onComplete }: VideoGeneratorProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<VideoScript | null>(null);

  const currentStage = PROCESSING_STAGES[stageIndex] || PROCESSING_STAGES[0];

  useEffect(() => {
    startGeneration();
  }, []);

  const startGeneration = async () => {
    try {
      setStageIndex(1);
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

      const composition = {
        durationSec: Math.min(assets.backgroundVideo.duration, 15),
        hookText: generatedScript.hook,
        subText: generatedScript.body,
        ctaText: generatedScript.cta,
        assets: {
          backgroundVideoUrl: assets.backgroundVideo.url,
          gifUrl: assets.gif?.url || '',
          musicUrl: assets.audio?.url || '',
          musicName: assets.audio?.name || '',
        },
        visualStyle: 'clean-ugc' as const,
      };

      const videoBlob = await generateVideo(
        composition,
        (stage: string, p: number) => {
          if (stage.includes('Loading')) {
            setStageIndex(2);
            setProgress(20 + Math.round(p * 0.1));
          } else if (stage.includes('Downloading')) {
            setStageIndex(3);
            setProgress(30 + Math.round(p * 0.2));
          } else if (stage.includes('Composing') || stage.includes('Finalizing')) {
            setStageIndex(p < 50 ? 4 : 5);
            setProgress(50 + Math.round(p * 0.4));
          }
        },
      );

      setStageIndex(6);
      setProgress(95);

      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      setProgress(100);
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
          onClick={() => {
            setError(null);
            setStageIndex(0);
            setProgress(0);
            startGeneration();
          }}
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
            <h4 className="font-medium text-zinc-900 dark:text-zinc-100">Generated Script</h4>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <p><span className="font-medium">Hook:</span> {script.hook}</p>
              <p><span className="font-medium">Body:</span> {script.body}</p>
              <p><span className="font-medium">CTA:</span> {script.cta}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-linear-to-b from-blue-50 to-white dark:from-blue-950 dark:to-zinc-900 rounded-xl p-8 border border-blue-100 dark:border-blue-900">
      <div className="text-center space-y-6">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800" />
          <div
            className="absolute inset-0 rounded-full border-4 border-blue-600 dark:border-blue-400 border-t-transparent animate-spin"
            style={{ animationDuration: '1s' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {currentStage.verb}...
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {currentStage.description}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Processing your video</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-linear-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-center gap-1.5 pt-2">
          {PROCESSING_STAGES.slice(1, -1).map((stage, i) => (
            <div
              key={stage.key}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                i + 1 <= stageIndex
                  ? 'bg-blue-600 dark:bg-blue-400'
                  : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            />
          ))}
        </div>

        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          This usually takes 30-60 seconds
        </p>
      </div>
    </div>
  );
}
