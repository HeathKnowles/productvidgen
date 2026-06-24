import type { GifAsset } from '@/lib/types';

const MEME_API_BASE = 'https://meme-api.com/gimme';

const REACTION_SUBREDDITS = [
  'reactiongifs',
  'gifs',
  'MemeEconomy',
  'dankmemes',
  'memes',
];

interface MemeResponse {
  postLink: string;
  subreddit: string;
  title: string;
  url: string;
  nsfw: boolean;
  spoiler: boolean;
  author: string;
  ups: number;
  preview: string[];
}

interface MultipleMemeResponse {
  count: number;
  memes: MemeResponse[];
}

export async function getRandomMemes(count: number = 10): Promise<GifAsset[]> {
  const res = await fetch(`${MEME_API_BASE}/${count}`);
  if (!res.ok) {
    throw new Error(`Meme API error: ${res.status}`);
  }

  const data: MultipleMemeResponse = await res.json();

  return data.memes
    .filter(meme => !meme.nsfw && !meme.spoiler && isImageOrGif(meme.url))
    .map(meme => ({
      id: meme.postLink,
      url: meme.url,
      thumbnailUrl: meme.preview?.[0] || meme.url,
      width: 400,
      height: 400,
      source: 'tenor' as const,
    }));
}

export async function getReactionMemes(count: number = 5): Promise<GifAsset[]> {
  const subreddit = REACTION_SUBREDDITS[Math.floor(Math.random() * REACTION_SUBREDDITS.length)];

  const res = await fetch(`${MEME_API_BASE}/${subreddit}/${count}`);
  if (!res.ok) {
    throw new Error(`Meme API error: ${res.status}`);
  }

  const data: MultipleMemeResponse = await res.json();

  return data.memes
    .filter(meme => !meme.nsfw && !meme.spoiler && isImageOrGif(meme.url))
    .map(meme => ({
      id: meme.postLink,
      url: meme.url,
      thumbnailUrl: meme.preview?.[0] || meme.url,
      width: 400,
      height: 400,
      source: 'tenor' as const,
    }));
}

export async function getViralMeme(): Promise<GifAsset> {
  const memes = await getReactionMemes(10);

  if (!memes.length) {
    const fallback = await getRandomMemes(5);
    if (!fallback.length) {
      throw new Error('No memes found');
    }
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  return memes[Math.floor(Math.random() * memes.length)];
}

function isImageOrGif(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.endsWith('.gif') ||
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.webp') ||
    lower.includes('i.redd.it') ||
    lower.includes('imgur');
}
