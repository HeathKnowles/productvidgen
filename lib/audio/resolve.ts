import { searchFreesound, getPreviewUrl, getSfxCueForProduct, type SfxCue } from './freesound';
import type { AudioMood } from '@/lib/types/video';

export type { AudioMood };

export interface AudioPlan {
  mood: AudioMood;
  sfxCue?: SfxCue;
}

export interface ResolvedAudio {
  musicUrl: string;
  musicDuration: number;
  musicName: string;
  musicSource: string;
  sfxUrl?: string;
  sfxName?: string;
}

const MUSIC_LIBRARY: Record<AudioMood, { url: string; name: string; duration: number }> = {
  'playful': {
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749d484.mp3',
    name: 'Playful Quirky',
    duration: 10,
  },
  'hype': {
    url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946b0939c8.mp3',
    name: 'Energetic Beat',
    duration: 10,
  },
  'dramatic': {
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bab.mp3',
    name: 'Cinematic Tension',
    duration: 10,
  },
  'clean-tech': {
    url: 'https://cdn.pixabay.com/download/audio/2023/07/30/audio_e49f87ca90.mp3',
    name: 'Modern Corporate',
    duration: 10,
  },
  'beauty': {
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    name: 'Aesthetic Vibes',
    duration: 10,
  },
  'chaotic': {
    url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3',
    name: 'Funny Meme',
    duration: 10,
  },
};

export async function resolveAudio(
  plan: AudioPlan,
  productContext?: string
): Promise<ResolvedAudio> {
  const music = MUSIC_LIBRARY[plan.mood];
  const musicUrl = music.url;
  const musicName = music.name;
  const musicDuration = music.duration;
  const musicSource = 'pixabay';

  let sfxUrl: string | undefined;
  let sfxName: string | undefined;

  const sfxCue = plan.sfxCue || (productContext ? getSfxCueForProduct(productContext) : undefined);

  if (sfxCue) {
    const sfxResult = await searchFreesound(sfxCue);
    if (sfxResult) {
      sfxUrl = getPreviewUrl(sfxResult);
      sfxName = sfxResult.name;
      console.log('Using SFX:', sfxResult.name);
    }
  }

  return {
    musicUrl,
    musicDuration,
    musicName,
    musicSource,
    sfxUrl,
    sfxName,
  };
}

export function moodFromVibe(vibe: string): AudioMood {
  const mapping: Record<string, AudioMood> = {
    'funny': 'playful',
    'dramatic': 'dramatic',
    'aspirational': 'clean-tech',
    'chaotic': 'chaotic',
    'tutorial': 'clean-tech',
    'relatable': 'playful',
    'hype': 'hype',
    'beauty': 'beauty',
    'lifestyle': 'clean-tech',
  };

  return mapping[vibe.toLowerCase()] || 'playful';
}
