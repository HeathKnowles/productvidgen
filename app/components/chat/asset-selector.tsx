'use client';

import { useState, useEffect } from 'react';
import type { VideoAsset, GifAsset, AudioAsset, AssetSelection } from '@/lib/types';
import { AssetGrid } from '../preview/asset-grid';

interface AssetSelectorProps {
  searchTerms: { video: string[]; gif: string[] };
  onComplete: (assets: AssetSelection) => void;
}

type Step = 'video' | 'gif' | 'audio';

export function AssetSelector({ searchTerms, onComplete }: AssetSelectorProps) {
  const [step, setStep] = useState<Step>('video');
  const [videos, setVideos] = useState<VideoAsset[]>([]);
  const [gifs, setGifs] = useState<GifAsset[]>([]);
  const [audio, setAudio] = useState<AudioAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedVideo, setSelectedVideo] = useState<VideoAsset | null>(null);
  const [selectedGif, setSelectedGif] = useState<GifAsset | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<AudioAsset | null>(null);

  useEffect(() => {
    if (step === 'video' && videos.length === 0) {
      loadVideos();
    } else if (step === 'gif' && gifs.length === 0) {
      loadGifs();
    } else if (step === 'audio' && audio.length === 0) {
      loadAudio();
    }
  }, [step]);

  const loadVideos = async () => {
    setIsLoading(true);
    try {
      const query = searchTerms.video[0] || 'product lifestyle';
      const res = await fetch(`/api/assets/videos?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Failed to load videos:', error);
    }
    setIsLoading(false);
  };

  const loadGifs = async () => {
    setIsLoading(true);
    try {
      const query = searchTerms.gif[0] || 'excited reaction';
      const res = await fetch(`/api/assets/gifs?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setGifs(data.gifs || []);
    } catch (error) {
      console.error('Failed to load gifs:', error);
    }
    setIsLoading(false);
  };

  const loadAudio = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/assets/audio');
      const data = await res.json();
      setAudio(data.audio || []);
    } catch (error) {
      console.error('Failed to load audio:', error);
    }
    setIsLoading(false);
  };

  const handleNext = () => {
    if (step === 'video' && selectedVideo) {
      setStep('gif');
    } else if (step === 'gif') {
      setStep('audio');
    } else if (step === 'audio') {
      onComplete({
        backgroundVideo: selectedVideo || undefined,
        gif: selectedGif || undefined,
        audio: selectedAudio || undefined,
      });
    }
  };

  const handleSkip = () => {
    if (step === 'video') {
      setStep('gif');
    } else if (step === 'gif') {
      setStep('audio');
    } else if (step === 'audio') {
      onComplete({
        backgroundVideo: selectedVideo || undefined,
        gif: selectedGif || undefined,
        audio: selectedAudio || undefined,
      });
    }
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
          {step === 'video' && 'Select Background Video'}
          {step === 'gif' && 'Add a GIF Overlay (optional)'}
          {step === 'audio' && 'Choose Background Music (optional)'}
        </h3>
        <div className="flex gap-1">
          {(['video', 'gif', 'audio'] as Step[]).map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full ${
                s === step
                  ? 'bg-blue-500'
                  : step === 'video' || (step === 'gif' && s === 'video') || (step === 'audio' && s !== 'audio')
                  ? 'bg-blue-300'
                  : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {step === 'video' && (
          <AssetGrid
            assets={videos}
            type="video"
            selected={selectedVideo || undefined}
            onSelect={setSelectedVideo}
            isLoading={isLoading}
          />
        )}
        {step === 'gif' && (
          <AssetGrid
            assets={gifs}
            type="gif"
            selected={selectedGif || undefined}
            onSelect={setSelectedGif}
            isLoading={isLoading}
          />
        )}
        {step === 'audio' && (
          <AssetGrid
            assets={audio}
            type="audio"
            selected={selectedAudio || undefined}
            onSelect={setSelectedAudio}
            isLoading={isLoading}
          />
        )}
      </div>

      <div className="flex justify-end gap-2">
        {step !== 'video' && (
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Skip
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={step === 'video' && !selectedVideo}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === 'audio' ? 'Generate Video' : 'Next'}
        </button>
      </div>
    </div>
  );
}
