export type Vibe = 'funny' | 'dramatic' | 'aspirational' | 'chaotic' | 'tutorial' | 'relatable';
export type AudioMood = 'playful' | 'hype' | 'clean-tech' | 'beauty' | 'chaotic' | 'dramatic';
export type VisualStyle = 'meme' | 'clean-ugc' | 'chaotic-zoom';
export type SfxCue = 'camera-shutter' | 'cash' | 'dramatic-hit' | 'pop' | 'whoosh' | 'success' | 'notification';

export interface ProductRequest {
  isVideoRequest: boolean;
  productName?: string;
  productUrl?: string;
  productDescription?: string;
  needsMoreInfo: boolean;
  followUpQuestion?: string;
}

export interface ProductSummary {
  oneLiner: string;
  targetAudience: string;
  coreBenefits: string[];
  socialHooks: string[];
  vibe: Vibe;
  keywordsForBackgroundSearch: string[];
  gifSearchTerms: string[];
}

export interface VideoPlan {
  durationSec: number;
  hookText: string;
  subText?: string;
  ctaText: string;
  backgroundQuery: string;
  gifQuery: string;
  audioMood: AudioMood;
  sfxCue?: SfxCue;
  visualStyle: VisualStyle;
}

export interface ResolvedAssets {
  backgroundVideoUrl: string;
  gifUrl: string;
  musicUrl: string;
  musicName: string;
  sfxUrl?: string;
  sfxName?: string;
}

export interface VideoComposition {
  durationSec: number;
  hookText: string;
  subText?: string;
  ctaText: string;
  assets: ResolvedAssets;
  visualStyle: VisualStyle;
}

export interface RenderJob {
  id: string;
  status: 'queued' | 'scraping' | 'planning' | 'assets' | 'rendering' | 'done' | 'failed';
  productUrl?: string;
  productSummary?: ProductSummary;
  videoPlan?: VideoPlan;
  composition?: VideoComposition;
  outputUrl?: string;
  error?: string;
  createdAt: number;
}
