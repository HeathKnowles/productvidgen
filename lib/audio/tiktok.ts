export interface TikTokSound {
  musicId: string;
  musicName: string;
  musicAuthor: string;
  playUrl: string;
  coverUrl: string | null;
  duration: number;
  videoCount: string;
}

export interface TikTokSoundResult {
  id: string;
  musicMeta: {
    musicId: string;
    musicName: string;
    musicAuthor: string;
    playUrl: string;
    coverMediumUrl: string | null;
  };
  searchMusic?: {
    videos: string;
  };
}

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const TIKTOK_SOUND_ACTOR = 'clockworks/tiktok-sound-scraper';

const CURATED_TRENDING_SOUNDS: Record<string, string[]> = {
  'playful': [
    'https://www.tiktok.com/music/original-sound-7298374927483928321',
    'https://www.tiktok.com/music/Cute-6781709531037190145',
  ],
  'hype': [
    'https://www.tiktok.com/music/BACKGROUND-MUSIC-7177277937315974917',
    'https://www.tiktok.com/music/original-sound-7219065644241618693',
  ],
  'dramatic': [
    'https://www.tiktok.com/music/Suspense-horror-background-music-7129050956003281666',
    'https://www.tiktok.com/music/Epic-Cinematic-7088529163060269826',
  ],
  'clean-tech': [
    'https://www.tiktok.com/music/Corporate-Technology-7055947851627809538',
    'https://www.tiktok.com/music/Inspiring-Corporate-7066785788602969857',
  ],
  'beauty': [
    'https://www.tiktok.com/music/Aesthetic-7128929539928733442',
    'https://www.tiktok.com/music/GRWM-7204923842215457542',
  ],
  'chaotic': [
    'https://www.tiktok.com/music/Funny-Background-Music-7101532171685122817',
    'https://www.tiktok.com/music/Meme-Sound-7053278534834368257',
  ],
};

export type AudioMood = keyof typeof CURATED_TRENDING_SOUNDS;

export async function discoverTikTokSound(mood: AudioMood): Promise<TikTokSound | null> {
  if (!APIFY_API_TOKEN) {
    console.warn('APIFY_API_TOKEN not configured, using fallback');
    return null;
  }

  const soundUrls = CURATED_TRENDING_SOUNDS[mood];
  const soundUrl = soundUrls[Math.floor(Math.random() * soundUrls.length)];

  try {
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(TIKTOK_SOUND_ACTOR)}/runs?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          musics: [soundUrl],
          resultsPerPage: 1,
          shouldDownloadVideos: false,
          shouldDownloadCovers: false,
        }),
      }
    );

    if (!runResponse.ok) {
      console.error('Apify run failed:', runResponse.status);
      return null;
    }

    const runData = await runResponse.json();
    const runId = runData.data?.id;

    if (!runId) {
      console.error('No run ID returned');
      return null;
    }

    let status = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 30;

    while (status === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/${encodeURIComponent(TIKTOK_SOUND_ACTOR)}/runs/${runId}?token=${APIFY_API_TOKEN}`
      );
      const statusData = await statusResponse.json();
      status = statusData.data?.status;
      attempts++;
    }

    if (status !== 'SUCCEEDED') {
      console.error('Apify run did not succeed:', status);
      return null;
    }

    const datasetResponse = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(TIKTOK_SOUND_ACTOR)}/runs/${runId}/dataset/items?token=${APIFY_API_TOKEN}`
    );

    if (!datasetResponse.ok) {
      console.error('Failed to fetch dataset');
      return null;
    }

    const results: TikTokSoundResult[] = await datasetResponse.json();

    if (!results || results.length === 0) {
      console.error('No results from TikTok sound scraper');
      return null;
    }

    const item = results[0];

    return {
      musicId: item.musicMeta.musicId,
      musicName: item.musicMeta.musicName,
      musicAuthor: item.musicMeta.musicAuthor,
      playUrl: item.musicMeta.playUrl,
      coverUrl: item.musicMeta.coverMediumUrl,
      duration: 10,
      videoCount: item.searchMusic?.videos || '0',
    };
  } catch (error) {
    console.error('TikTok sound discovery failed:', error);
    return null;
  }
}

export async function getTikTokSoundDirect(soundUrl: string): Promise<TikTokSound | null> {
  if (!APIFY_API_TOKEN) return null;

  try {
    const response = await fetch(
      `https://api.apify.com/v2/acts/${encodeURIComponent(TIKTOK_SOUND_ACTOR)}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          musics: [soundUrl],
          resultsPerPage: 1,
          shouldDownloadVideos: false,
          shouldDownloadCovers: false,
        }),
      }
    );

    if (!response.ok) return null;

    const results: TikTokSoundResult[] = await response.json();
    if (!results || results.length === 0) return null;

    const item = results[0];

    return {
      musicId: item.musicMeta.musicId,
      musicName: item.musicMeta.musicName,
      musicAuthor: item.musicMeta.musicAuthor,
      playUrl: item.musicMeta.playUrl,
      coverUrl: item.musicMeta.coverMediumUrl,
      duration: 10,
      videoCount: item.searchMusic?.videos || '0',
    };
  } catch (error) {
    console.error('Direct TikTok sound fetch failed:', error);
    return null;
  }
}
