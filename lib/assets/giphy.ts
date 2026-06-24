import type { GifAsset } from '@/lib/types';

const GIPHY_API_KEY = process.env.GIPHY_API_KEY;

interface GiphyGif {
  id: string;
  url: string;
  images: {
    original: {
      url: string;
      width: string;
      height: string;
    };
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
    preview_gif: {
      url: string;
    };
  };
}

interface GiphyResponse {
  data: GiphyGif[];
}

export async function searchGifs(
  query: string,
  options: { limit?: number } = {}
): Promise<GifAsset[]> {
  const { limit = 20 } = options;

  if (!GIPHY_API_KEY) {
    throw new Error('GIPHY_API_KEY is not configured');
  }

  const params = new URLSearchParams({
    api_key: GIPHY_API_KEY,
    q: query,
    limit: String(limit),
    rating: 'g',
  });

  const response = await fetch(
    `https://api.giphy.com/v1/gifs/search?${params}`
  );

  if (!response.ok) {
    throw new Error(`Giphy API error: ${response.status}`);
  }

  const data: GiphyResponse = await response.json();

  return data.data.map((gif) => ({
    id: gif.id,
    url: gif.images.original.url,
    thumbnailUrl: gif.images.fixed_height.url,
    width: parseInt(gif.images.original.width, 10),
    height: parseInt(gif.images.original.height, 10),
    source: 'giphy' as const,
  }));
}
