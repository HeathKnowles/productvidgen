import { chat } from '@/lib/ai';
import { scrapeWebsite } from '@/lib/scraper';
import { searchVideos } from '@/lib/assets/pexels';
import { searchGifs } from '@/lib/assets/giphy';
import { resolveAudio, moodFromVibe } from '@/lib/audio/resolve';
import { ingestVideo, ingestGif } from '@/lib/audio/ingest';
import type {
  ProductRequest,
  ProductSummary,
  VideoPlan,
  VideoComposition,
  ResolvedAssets,
} from '@/lib/types/video';

const PARSE_PROMPT = `Analyze this message for a UGC video generator. Return JSON only:
{
  "isVideoRequest": boolean,
  "productName": string | null,
  "productUrl": string | null,
  "productDescription": string | null,
  "needsMoreInfo": boolean,
  "followUpQuestion": string | null
}

Rules:
- isVideoRequest=true if user wants a video OR mentions product/app/business/URL
- Extract URL (add https:// if needed)
- needsMoreInfo=true only if they want video but gave nothing to work with`;

const SUMMARIZE_PROMPT = `You're a TikTok creative strategist. Analyze this product and return JSON:
{
  "oneLiner": "Punchy one-sentence description",
  "targetAudience": "Who this is for",
  "coreBenefits": ["benefit1", "benefit2", "benefit3"],
  "socialHooks": ["POV: hook idea", "That feeling when..."],
  "vibe": "funny" | "dramatic" | "aspirational" | "chaotic" | "tutorial" | "relatable",
  "keywordsForBackgroundSearch": ["stock video keyword1", "keyword2"],
  "gifSearchTerms": ["reaction gif term1", "term2"]
}

Pick vibe for best TikTok energy. Be specific with search terms.`;

const PLAN_PROMPT = `Create ONE tight 7-second UGC video concept. Return JSON:
{
  "durationSec": 7,
  "hookText": "Main headline, max 8 words, TikTok style (POV:, When..., etc)",
  "subText": "Supporting text, max 10 words",
  "ctaText": "Brand/CTA, max 4 words",
  "backgroundQuery": "Specific stock video search",
  "gifQuery": "Specific reaction GIF search",
  "audioMood": "playful" | "hype" | "dramatic" | "clean-tech" | "beauty" | "chaotic",
  "sfxCue": "camera-shutter" | "cash" | "dramatic-hit" | "pop" | "whoosh" | null,
  "visualStyle": "meme" | "clean-ugc" | "chaotic-zoom"
}`;

export async function parseMessage(message: string): Promise<ProductRequest> {
  const result = await chat({
    messages: [
      { role: 'system', content: PARSE_PROMPT },
      { role: 'user', content: message },
    ],
    json: true,
  });
  return JSON.parse(result);
}

export async function summarizeProduct(
  url: string | null,
  name: string | null,
  description: string | null
): Promise<ProductSummary> {
  let context = '';

  if (url) {
    try {
      const scraped = await scrapeWebsite(url);
      context = `URL: ${url}\nTitle: ${scraped.title}\nDescription: ${scraped.description}\nContent: ${scraped.headings.join('. ')}. ${scraped.paragraphs.slice(0, 5).join(' ')}`;
    } catch {
      context = `URL: ${url}`;
    }
  }
  if (name) context += `\nProduct: ${name}`;
  if (description) context += `\nDescription: ${description}`;
  if (!context) context = 'Generic product';

  const result = await chat({
    messages: [
      { role: 'system', content: SUMMARIZE_PROMPT },
      { role: 'user', content: context },
    ],
    json: true,
  });
  return JSON.parse(result);
}

export async function planVideo(summary: ProductSummary): Promise<VideoPlan> {
  const result = await chat({
    messages: [
      { role: 'system', content: PLAN_PROMPT },
      { role: 'user', content: JSON.stringify(summary) },
    ],
    json: true,
  });
  return JSON.parse(result);
}

export async function resolveAssets(
  plan: VideoPlan,
  productContext: string
): Promise<ResolvedAssets> {
  const [videos, gifs, audio] = await Promise.all([
    searchVideos(plan.backgroundQuery, { limit: 5, orientation: 'portrait' }),
    searchGifs(plan.gifQuery, { limit: 8 }),
    resolveAudio(
      { mood: plan.audioMood, sfxCue: plan.sfxCue },
      productContext
    ),
  ]);

  const video = videos[0];
  if (!video) throw new Error('No background video found for: ' + plan.backgroundQuery);

  const gif = gifs[Math.floor(Math.random() * Math.min(4, gifs.length))];
  if (!gif) throw new Error('No GIF found for: ' + plan.gifQuery);

  const [ingestedVideo, ingestedGif] = await Promise.all([
    ingestVideo(video.url, 'pexels', video.id),
    ingestGif(gif.url, 'giphy', gif.id),
  ]);

  return {
    backgroundVideoUrl: ingestedVideo.storageUrl,
    gifUrl: ingestedGif.storageUrl,
    musicUrl: audio.musicUrl,
    musicName: audio.musicName,
    sfxUrl: audio.sfxUrl,
    sfxName: audio.sfxName,
  };
}

export async function buildComposition(
  plan: VideoPlan,
  assets: ResolvedAssets
): Promise<VideoComposition> {
  return {
    durationSec: plan.durationSec,
    hookText: plan.hookText,
    subText: plan.subText,
    ctaText: plan.ctaText,
    assets,
    visualStyle: plan.visualStyle,
  };
}

export interface PipelineResult {
  composition: VideoComposition;
  summary: ProductSummary;
  plan: VideoPlan;
}

export async function runPipeline(
  request: ProductRequest,
  onStatus?: (status: string) => void
): Promise<PipelineResult> {
  onStatus?.('Analyzing product...');
  const summary = await summarizeProduct(
    request.productUrl || null,
    request.productName || null,
    request.productDescription || null
  );

  onStatus?.('Planning video concept...');
  const plan = await planVideo(summary);

  onStatus?.('Gathering assets...');
  const productContext = `${request.productName || ''} ${request.productDescription || ''} ${summary.oneLiner}`;
  const assets = await resolveAssets(plan, productContext);

  onStatus?.('Building composition...');
  const composition = await buildComposition(plan, assets);

  return { composition, summary, plan };
}
