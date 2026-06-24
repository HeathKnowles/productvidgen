import { chat } from '@/lib/ai';
import { scrapeWebsite } from '@/lib/scraper';
import { searchVideos } from '@/lib/assets/pexels';
import { getViralMeme, getReactionMemes } from '@/lib/assets/memes';
import { resolveAudio } from '@/lib/audio/resolve';
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
  "gifSearchTerms": ["funny reaction term", "meme reaction term"]
}

Pick vibe for best TikTok energy. For gifSearchTerms, use FUNNY/MEME reaction GIF searches like "mind blown", "shocked face", "excited reaction", "slay", "its giving", "no way", "mic drop" - the kind that go viral on TikTok.`;

const PLAN_PROMPT = `You are a viral meme copywriter. Create ONE meme video concept.

Return JSON:
{
  "durationSec": 7,
  "hookText": "Viral meme caption - funny, relatable, self-deprecating",
  "subText": null,
  "ctaText": "Brand/app name only",
  "backgroundQuery": "aesthetic stock video for background",
  "gifQuery": "reaction meme gif search term",
  "audioMood": "playful" | "hype" | "dramatic" | "chaotic",
  "sfxCue": null,
  "visualStyle": "meme"
}

MEME CAPTION RULES:
- Use relatable day-to-day struggles of the target audience
- Self-deprecating humor > bragging
- Absurdist or exaggerated scenarios work great
- Reference the product benefit through HUMOR not features

VIRAL CAPTION FORMATS:
- "me pretending to [do thing] while [funny truth]"
- "POV: [absurd but relatable scenario]"
- "the [product] watching me [funny user behavior]"
- "my last brain cell trying to [task product helps with]"
- "[thing] exists / me: [funny reaction]"
- "how it started vs how it's going"
- "nobody: / me at 2am: [funny behavior]"

EXAMPLES for a calorie tracking app:
- "me logging 'one bite' of cake as 50 calories"
- "the app watching me eat my feelings"
- "POV: you find out grapes have calories"
- "my fitness journey: day 1 vs day 1 again"
- "me vs the recommended serving size"

Make it ACTUALLY FUNNY. Internet humor. Meme energy.`;

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
  const [videos, memes, viralMeme, audio] = await Promise.all([
    searchVideos(plan.backgroundQuery, { limit: 5, orientation: 'portrait' }),
    getReactionMemes(10).catch(() => []),
    getViralMeme().catch(() => null),
    resolveAudio(
      { mood: plan.audioMood, sfxCue: plan.sfxCue },
      productContext
    ),
  ]);

  const video = videos[0];
  if (!video) throw new Error('No background video found for: ' + plan.backgroundQuery);

  // Use reaction memes from Reddit, fall back to viral meme
  const meme = memes.length > 0
    ? memes[Math.floor(Math.random() * Math.min(5, memes.length))]
    : viralMeme;

  if (!meme) throw new Error('No meme/GIF found');

  return {
    backgroundVideoUrl: video.url,
    gifUrl: meme.url,
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
