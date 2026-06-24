import { chat } from '@/lib/ai';
import { scrapeWebsite } from '@/lib/scraper';
import { searchVideos } from '@/lib/assets/pexels';
import { searchGifs } from '@/lib/assets/giphy';
import { getViralMeme } from '@/lib/assets/memes';
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

const PLAN_PROMPT = `You are a viral meme copywriter. Create ONE meme video concept for the given product.

Return JSON:
{
  "durationSec": 7,
  "hookText": "Viral meme caption - funny, relatable, self-deprecating",
  "subText": null,
  "ctaText": "Brand/app name only",
  "backgroundQuery": "aesthetic stock video (NO PEOPLE)",
  "gifQuery": "reaction GIF emotion search",
  "audioMood": "playful" | "hype" | "dramatic" | "chaotic",
  "sfxCue": null,
  "visualStyle": "meme"
}

THE MEME IS THE SPEAKER:
The reaction GIF "says" the caption. Background is just atmosphere.

BACKGROUND (NO PEOPLE!):
- Abstract, atmospheric, aesthetic only
- Match the VIBE not literal scenario
- Examples: "neon lights", "coffee steam", "city bokeh", "sunset clouds", "water ripples", "keyboard typing closeup", "plants aesthetic"

GIF QUERY:
- Search for the EMOTION the caption expresses
- Examples: "confused", "shocked", "guilty", "side eye", "mind blown", "excited", "nervous", "disappointed", "smug", "crying laughing"

CAPTION FORMATS:
- "me pretending to [thing] while [truth]"
- "POV: [absurd but relatable scenario]"
- "the [product] watching me [funny behavior]"
- "my last brain cell trying to [task]"
- "nobody: / me: [behavior]"
- "[thing] exists / me:"

RULES:
- Self-deprecating > bragging
- Reference product benefit through HUMOR
- Make it relatable to the target audience
- Actually funny internet humor

Analyze the product and create a meme that fits IT specifically.`;

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
  // Search for contextual GIFs using the AI-generated query
  const [videos, gifs, fallbackMeme, audio] = await Promise.all([
    searchVideos(plan.backgroundQuery, { limit: 5, orientation: 'portrait' }),
    searchGifs(plan.gifQuery, { limit: 10 }).catch(() => []),
    getViralMeme().catch(() => null),
    resolveAudio(
      { mood: plan.audioMood, sfxCue: plan.sfxCue },
      productContext
    ),
  ]);

  const video = videos[0];
  if (!video) throw new Error('No background video found for: ' + plan.backgroundQuery);

  // Use contextual GIF from search, fall back to viral meme
  const gif = gifs.length > 0
    ? gifs[Math.floor(Math.random() * Math.min(5, gifs.length))]
    : fallbackMeme;

  if (!gif) throw new Error('No GIF found for: ' + plan.gifQuery);

  console.log('Asset matching:', {
    hookText: plan.hookText,
    backgroundQuery: plan.backgroundQuery,
    gifQuery: plan.gifQuery,
    foundVideo: video.url,
    foundGif: gif.url,
  });

  return {
    backgroundVideoUrl: video.url,
    gifUrl: gif.url,
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
