export type SfxCue = 'camera-shutter' | 'cash' | 'dramatic-hit' | 'pop' | 'whoosh' | 'success' | 'notification';

export interface FreesoundResult {
  id: number;
  name: string;
  duration: number;
  previews: {
    'preview-hq-mp3': string;
    'preview-lq-mp3': string;
  };
  tags: string[];
}

interface FreesoundSearchResponse {
  count: number;
  results: FreesoundResult[];
}

const FREESOUND_API_KEY = process.env.FREESOUND_API_KEY;

const SFX_QUERIES: Record<SfxCue, string> = {
  'camera-shutter': 'camera shutter click',
  'cash': 'cash register cha ching',
  'dramatic-hit': 'cinematic impact hit',
  'pop': 'pop click ui',
  'whoosh': 'whoosh transition fast',
  'success': 'success chime notification',
  'notification': 'notification ding alert',
};

export async function searchFreesound(cue: SfxCue): Promise<FreesoundResult | null> {
  if (!FREESOUND_API_KEY) {
    console.warn('FREESOUND_API_KEY not configured');
    return null;
  }

  const query = SFX_QUERIES[cue];

  const params = new URLSearchParams({
    query,
    token: FREESOUND_API_KEY,
    fields: 'id,name,duration,previews,tags',
    filter: 'duration:[0.1 TO 3]',
    sort: 'downloads_desc',
    page_size: '10',
  });

  try {
    const response = await fetch(`https://freesound.org/apiv2/search/text/?${params}`);

    if (!response.ok) {
      console.error('Freesound API error:', response.status);
      return null;
    }

    const data: FreesoundSearchResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      console.error('No Freesound results for:', cue);
      return null;
    }

    const validResults = data.results.filter(r => r.duration >= 0.1 && r.duration <= 3);

    return validResults[Math.floor(Math.random() * Math.min(5, validResults.length))] || null;
  } catch (error) {
    console.error('Freesound search failed:', error);
    return null;
  }
}

export function getPreviewUrl(result: FreesoundResult): string {
  return result.previews['preview-hq-mp3'] || result.previews['preview-lq-mp3'];
}

export function getSfxCueForProduct(productType: string): SfxCue {
  const lower = productType.toLowerCase();

  if (lower.includes('photo') || lower.includes('camera') || lower.includes('food')) {
    return 'camera-shutter';
  }
  if (lower.includes('finance') || lower.includes('money') || lower.includes('pay') || lower.includes('shop')) {
    return 'cash';
  }
  if (lower.includes('epic') || lower.includes('reveal') || lower.includes('launch')) {
    return 'dramatic-hit';
  }
  if (lower.includes('notification') || lower.includes('alert') || lower.includes('message')) {
    return 'notification';
  }
  if (lower.includes('success') || lower.includes('complete') || lower.includes('done')) {
    return 'success';
  }

  return 'pop';
}
