'use client';

import { useState, useRef } from 'react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onDownload?: () => void;
}

export function VideoPlayer({ src, poster, onDownload }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = 'ugc-video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onDownload?.();
  };

  return (
    <div className="bg-zinc-900 rounded-xl overflow-hidden">
      <div className="relative aspect-[9/16] max-h-[500px] mx-auto">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full h-full object-contain"
          onEnded={() => setIsPlaying(false)}
          playsInline
        />
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
        >
          {isPlaying ? (
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
      <div className="p-4 flex justify-center gap-3">
        <button
          onClick={togglePlay}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
        >
          {isPlaying ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play
            </>
          )}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
          Download
        </button>
      </div>
    </div>
  );
}
