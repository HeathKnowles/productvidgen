import { getAllAudio, getAudioByMood } from '@/lib/assets/audio';
import type { AudioAsset } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mood = searchParams.get('mood') as AudioAsset['mood'] | null;

  let audio: AudioAsset[];

  if (mood && ['upbeat', 'chill', 'energetic', 'dramatic'].includes(mood)) {
    audio = getAudioByMood(mood);
  } else {
    audio = getAllAudio();
  }

  return Response.json({ audio });
}
