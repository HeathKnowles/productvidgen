import type { GifAsset } from '@/lib/types';

const TENOR_API_KEY = process.env.TENOR_API_KEY || '';
const BASE_URL = 'https://tenor.googleapis.com/v2';

interface TenorMediaFormat {
  url: string;
  dims: [number, number];
  duration: number;
  size: number;
}

interface TenorResult {
  id: string;
  media_formats: {
    gif: TenorMediaFormat;
    tinygif: TenorMediaFormat;
    mediumgif?: TenorMediaFormat;
  };
  content_description: string;
}

interface TenorResponse {
  results: TenorResult[];
  next: string;
}

export async function searchTenorGifs(
  query: string,
  options: { limit?: number } = {}
): Promise<GifAsset[]> {
  const { limit = 20 } = options;

  if (!TENOR_API_KEY) {
    throw new Error('TENOR_API_KEY is not configured');
  }

  const params = new URLSearchParams({
    key: TENOR_API_KEY,
    q: query,
    limit: String(limit),
    contentfilter: 'medium',
    media_filter: 'gif,tinygif',
  });

  const res = await fetch(`${BASE_URL}/search?${params}`);
  if (!res.ok) {
    throw new Error(`Tenor API error: ${res.status}`);
  }

  const data: TenorResponse = await res.json();

  return data.results.map((result) => ({
    id: result.id,
    url: result.media_formats.gif.url,
    thumbnailUrl: result.media_formats.tinygif.url,
    width: result.media_formats.gif.dims[0],
    height: result.media_formats.gif.dims[1],
    source: 'tenor' as const,
  }));
}

export async function getTrendingTenorGifs(
  options: { limit?: number } = {}
): Promise<GifAsset[]> {
  const { limit = 20 } = options;

  if (!TENOR_API_KEY) {
    throw new Error('TENOR_API_KEY is not configured');
  }

  const params = new URLSearchParams({
    key: TENOR_API_KEY,
    limit: String(limit),
    contentfilter: 'medium',
    media_filter: 'gif,tinygif',
  });

  const res = await fetch(`${BASE_URL}/featured?${params}`);
  if (!res.ok) {
    throw new Error(`Tenor API error: ${res.status}`);
  }

  const data: TenorResponse = await res.json();

  return data.results.map((result) => ({
    id: result.id,
    url: result.media_formats.gif.url,
    thumbnailUrl: result.media_formats.tinygif.url,
    width: result.media_formats.gif.dims[0],
    height: result.media_formats.gif.dims[1],
    source: 'tenor' as const,
  }));
}

const VIRAL_REACTION_QUERIES = [
  'mind blown reaction',
  'shocked reaction meme',
  'slay queen',
  'mic drop',
  'no way omg',
  'impressed reaction',
  'excited happy dance',
  'its giving',
  'period queen',
  'shook surprised',
];

export async function getViralReactionGif(): Promise<GifAsset> {
  const query = VIRAL_REACTION_QUERIES[Math.floor(Math.random() * VIRAL_REACTION_QUERIES.length)];
  const gifs = await searchTenorGifs(query, { limit: 10 });

  if (!gifs.length) {
    throw new Error('No viral reaction GIFs found');
  }

  return gifs[Math.floor(Math.random() * gifs.length)];
}
