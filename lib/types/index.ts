export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  intent?: Intent;
  productData?: ProductData;
  assets?: AssetSelection;
  videoUrl?: string;
}

export type Intent =
  | 'describe_product'
  | 'provide_url'
  | 'select_assets'
  | 'generate_video'
  | 'ask_question'
  | 'modify_selection'
  | 'greeting';

export interface ProductData {
  name: string;
  description: string;
  features: string[];
  targetAudience: string;
  tone: 'professional' | 'casual' | 'energetic' | 'minimal';
  websiteUrl?: string;
  imageUrls?: string[];
}

export interface AssetSelection {
  backgroundVideo?: VideoAsset;
  gif?: GifAsset;
  audio?: AudioAsset;
}

export interface VideoAsset {
  id: string;
  url: string;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
  source: 'pexels';
}

export interface GifAsset {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  source: 'giphy' | 'tenor';
}

export interface AudioAsset {
  id: string;
  name: string;
  url: string;
  duration: number;
  mood: 'upbeat' | 'chill' | 'energetic' | 'dramatic';
}

export interface VideoScript {
  hook: string;
  body: string;
  cta: string;
  textOverlay: string;
}

export interface VideoJob {
  id: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number;
  productData: ProductData;
  assets: AssetSelection;
  script: VideoScript;
  outputUrl?: string;
  error?: string;
}

export type ChatPhase = 'gathering' | 'assets' | 'generating' | 'complete';

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentPhase: ChatPhase;
  productData: ProductData | null;
  assets: AssetSelection;
  videoJob: VideoJob | null;
}

export type ChatAction =
  | { type: 'ADD_MESSAGE'; message: Message }
  | { type: 'UPDATE_MESSAGE'; id: string; content: string }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_PHASE'; phase: ChatPhase }
  | { type: 'SET_PRODUCT_DATA'; data: ProductData }
  | { type: 'SET_ASSET'; key: keyof AssetSelection; asset: VideoAsset | GifAsset | AudioAsset }
  | { type: 'SET_VIDEO_JOB'; job: VideoJob }
  | { type: 'UPDATE_VIDEO_JOB'; updates: Partial<VideoJob> };
