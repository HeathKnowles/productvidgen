import type { VideoAsset } from '@/lib/types';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

interface PexelsVideo {
  id: number;
  url: string;
  duration: number;
  width: number;
  height: number;
  image: string;
  video_files: {
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }[];
}

interface PexelsResponse {
  videos: PexelsVideo[];
  total_results: number;
}

export async function searchVideos(
  query: string,
  options: { limit?: number; orientation?: 'landscape' | 'portrait' } = {}
): Promise<VideoAsset[]> {
  const { limit = 10, orientation = 'portrait' } = options;

  if (!PEXELS_API_KEY) {
    throw new Error('PEXELS_API_KEY is not configured');
  }

  const params = new URLSearchParams({
    query,
    per_page: String(limit),
    orientation,
  });

  const response = await fetch(
    `https://api.pexels.com/videos/search?${params}`,
    {
      headers: { Authorization: PEXELS_API_KEY },
    }
  );

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status}`);
  }

  const data: PexelsResponse = await response.json();

  return data.videos.map((video) => {
    const bestFile = video.video_files
      .filter((f) => f.quality === 'hd' || f.quality === 'sd')
      .sort((a, b) => b.height - a.height)[0];

    return {
      id: String(video.id),
      url: bestFile?.link || video.video_files[0]?.link || '',
      thumbnailUrl: video.image,
      duration: video.duration,
      width: bestFile?.width || video.width,
      height: bestFile?.height || video.height,
      source: 'pexels' as const,
    };
  });
}
