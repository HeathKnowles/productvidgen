import type { AudioAsset } from '@/lib/types';

export const audioLibrary: AudioAsset[] = [
  {
    id: 'upbeat-1',
    name: 'Energy Boost',
    url: '/audio/energy-boost.mp3',
    duration: 30,
    mood: 'upbeat',
  },
  {
    id: 'upbeat-2',
    name: 'Feel Good Vibes',
    url: '/audio/feel-good-vibes.mp3',
    duration: 30,
    mood: 'upbeat',
  },
  {
    id: 'chill-1',
    name: 'Smooth Lofi',
    url: '/audio/smooth-lofi.mp3',
    duration: 30,
    mood: 'chill',
  },
  {
    id: 'chill-2',
    name: 'Relaxed Afternoon',
    url: '/audio/relaxed-afternoon.mp3',
    duration: 30,
    mood: 'chill',
  },
  {
    id: 'energetic-1',
    name: 'Pump It Up',
    url: '/audio/pump-it-up.mp3',
    duration: 30,
    mood: 'energetic',
  },
  {
    id: 'energetic-2',
    name: 'Hype Train',
    url: '/audio/hype-train.mp3',
    duration: 30,
    mood: 'energetic',
  },
  {
    id: 'dramatic-1',
    name: 'Epic Reveal',
    url: '/audio/epic-reveal.mp3',
    duration: 30,
    mood: 'dramatic',
  },
  {
    id: 'dramatic-2',
    name: 'Cinematic Build',
    url: '/audio/cinematic-build.mp3',
    duration: 30,
    mood: 'dramatic',
  },
];

export function getAudioByMood(mood: AudioAsset['mood']): AudioAsset[] {
  return audioLibrary.filter((audio) => audio.mood === mood);
}

export function getAudioById(id: string): AudioAsset | undefined {
  return audioLibrary.find((audio) => audio.id === id);
}

export function getAllAudio(): AudioAsset[] {
  return audioLibrary;
}
