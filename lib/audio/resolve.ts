import { discoverTikTokSound, type AudioMood, type TikTokSound } from './tiktok';
import { searchFreesound, getPreviewUrl, getSfxCueForProduct, type SfxCue, type FreesoundResult } from './freesound';
import { ingestAudio } from './ingest';

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

const FALLBACK_MUSIC: Record<AudioMood, { url: string; name: string; duration: number }> = {
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
  let musicUrl: string;
  let musicName: string;
  let musicDuration: number;
  let musicSource: string;

  const tiktokSound = await discoverTikTokSound(plan.mood);

  if (tiktokSound && tiktokSound.playUrl) {
    try {
      const ingested = await ingestAudio(
        tiktokSound.playUrl,
        'tiktok',
        tiktokSound.musicId,
        tiktokSound.duration
      );
      musicUrl = ingested.storageUrl;
      musicName = tiktokSound.musicName;
      musicDuration = tiktokSound.duration;
      musicSource = 'tiktok';
      console.log('Using TikTok sound:', tiktokSound.musicName);
    } catch (error) {
      console.error('Failed to ingest TikTok sound, using fallback:', error);
      const fallback = FALLBACK_MUSIC[plan.mood];
      const ingested = await ingestAudio(fallback.url, 'fallback', plan.mood, fallback.duration);
      musicUrl = ingested.storageUrl;
      musicName = fallback.name;
      musicDuration = fallback.duration;
      musicSource = 'fallback';
    }
  } else {
    console.log('No TikTok sound available, using fallback');
    const fallback = FALLBACK_MUSIC[plan.mood];
    try {
      const ingested = await ingestAudio(fallback.url, 'fallback', plan.mood, fallback.duration);
      musicUrl = ingested.storageUrl;
      musicName = fallback.name;
      musicDuration = fallback.duration;
      musicSource = 'fallback';
    } catch {
      musicUrl = fallback.url;
      musicName = fallback.name;
      musicDuration = fallback.duration;
      musicSource = 'fallback-direct';
    }
  }

  let sfxUrl: string | undefined;
  let sfxName: string | undefined;

  if (plan.sfxCue) {
    const sfxResult = await searchFreesound(plan.sfxCue);
    if (sfxResult) {
      try {
        const sfxSourceUrl = getPreviewUrl(sfxResult);
        const ingested = await ingestAudio(
          sfxSourceUrl,
          'freesound',
          String(sfxResult.id),
          sfxResult.duration
        );
        sfxUrl = ingested.storageUrl;
        sfxName = sfxResult.name;
        console.log('Using SFX:', sfxResult.name);
      } catch (error) {
        console.error('Failed to ingest SFX:', error);
      }
    }
  } else if (productContext) {
    const inferredCue = getSfxCueForProduct(productContext);
    const sfxResult = await searchFreesound(inferredCue);
    if (sfxResult) {
      try {
        const sfxSourceUrl = getPreviewUrl(sfxResult);
        const ingested = await ingestAudio(
          sfxSourceUrl,
          'freesound',
          String(sfxResult.id),
          sfxResult.duration
        );
        sfxUrl = ingested.storageUrl;
        sfxName = sfxResult.name;
        console.log('Using inferred SFX:', sfxResult.name);
      } catch (error) {
        console.error('Failed to ingest inferred SFX:', error);
      }
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
