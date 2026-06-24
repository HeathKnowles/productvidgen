import { GiphyFetch } from '@giphy/js-fetch-api';
import type { GifAsset } from '@/lib/types';

const GIPHY_API_KEY = process.env.GIPHY_API_KEY || '';

const gf = new GiphyFetch(GIPHY_API_KEY);

export async function searchGifs(
  query: string,
  options: { limit?: number; offset?: number } = {}
): Promise<GifAsset[]> {
  const { limit = 20, offset = 0 } = options;

  if (!GIPHY_API_KEY) {
    throw new Error('GIPHY_API_KEY is not configured');
  }

  const { data } = await gf.search(query, { limit, offset, rating: 'g' });

  return data.map((gif) => ({
    id: String(gif.id),
    url: gif.images.original.url,
    thumbnailUrl: gif.images.fixed_height.url,
    width: parseInt(String(gif.images.original.width), 10),
    height: parseInt(String(gif.images.original.height), 10),
    source: 'giphy' as const,
  }));
}

export async function getTrendingGifs(
  options: { limit?: number; offset?: number } = {}
): Promise<GifAsset[]> {
  const { limit = 20, offset = 0 } = options;

  if (!GIPHY_API_KEY) {
    throw new Error('GIPHY_API_KEY is not configured');
  }

  const { data } = await gf.trending({ limit, offset, rating: 'g' });

  return data.map((gif) => ({
    id: String(gif.id),
    url: gif.images.original.url,
    thumbnailUrl: gif.images.fixed_height.url,
    width: parseInt(String(gif.images.original.width), 10),
    height: parseInt(String(gif.images.original.height), 10),
    source: 'giphy' as const,
  }));
}

export async function getGifById(id: string): Promise<GifAsset> {
  if (!GIPHY_API_KEY) {
    throw new Error('GIPHY_API_KEY is not configured');
  }

  const { data } = await gf.gif(id);

  return {
    id: String(data.id),
    url: data.images.original.url,
    thumbnailUrl: data.images.fixed_height.url,
    width: parseInt(String(data.images.original.width), 10),
    height: parseInt(String(data.images.original.height), 10),
    source: 'giphy' as const,
  };
}
