'use client';

import { useState } from 'react';
import type { VideoAsset, GifAsset, AudioAsset } from '@/lib/types';

interface AssetGridProps<T> {
  assets: T[];
  type: 'video' | 'gif' | 'audio';
  selected?: T;
  onSelect: (asset: T) => void;
  isLoading?: boolean;
}

export function AssetGrid<T extends VideoAsset | GifAsset | AudioAsset>({
  assets,
  type,
  selected,
  onSelect,
  isLoading = false,
}: AssetGridProps<T>) {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[9/16] bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
        No assets found. Try a different search.
      </p>
    );
  }

  if (type === 'audio') {
    return (
      <div className="space-y-2">
        {(assets as AudioAsset[]).map((asset) => (
          <button
            key={asset.id}
            onClick={() => onSelect(asset as T)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              (selected as AudioAsset)?.id === asset.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <div
              className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setPlayingAudio(playingAudio === asset.id ? null : asset.id);
              }}
            >
              {playingAudio === asset.id ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {asset.name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {asset.mood} · {asset.duration}s
              </p>
            </div>
            {(selected as AudioAsset)?.id === asset.id && (
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {assets.map((asset) => {
        const isSelected =
          type === 'video'
            ? (selected as VideoAsset)?.id === (asset as VideoAsset).id
            : (selected as GifAsset)?.id === (asset as GifAsset).id;

        const thumbnailUrl =
          type === 'video'
            ? (asset as VideoAsset).thumbnailUrl
            : (asset as GifAsset).thumbnailUrl;

        return (
          <button
            key={asset.id}
            onClick={() => onSelect(asset)}
            className={`relative aspect-[9/16] rounded-lg overflow-hidden border-2 transition-colors ${
              isSelected
                ? 'border-blue-500'
                : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <img
              src={thumbnailUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            {isSelected && (
              <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
