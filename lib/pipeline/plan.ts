import { chat } from '@/lib/ai';
import type { ProductSummary, VideoPlan } from '@/lib/types/video';

const PLAN_PROMPT = `You're a TikTok creative director. Create ONE tight video concept (7 seconds).

Given a product brief, plan a single-scene UGC ad. Return JSON only:
{
  "durationSec": 7,
  "hookText": "The main headline (max 8 words, punchy, POV style works well)",
  "subText": "Supporting text (max 10 words, optional)",
  "ctaText": "Brand name or short CTA (max 4 words)",
  "backgroundQuery": "Specific stock video search query",
  "gifQuery": "Specific reaction GIF search term",
  "audioMood": "hype" | "playful" | "dramatic" | "clean-pop",
  "visualStyle": "meme" | "clean-ugc" | "chaotic-zoom"
}

Rules:
- hookText should feel like a TikTok hook (POV:, When..., That feeling when...)
- backgroundQuery should match the product context (person using phone for apps, cooking for food, etc.)
- gifQuery should be a reaction that amplifies the hook (shocked, mind blown, happy dance)
- Match audioMood to the vibe
- visualStyle: meme (text-heavy, reaction), clean-ugc (minimal, aesthetic), chaotic-zoom (fast, energetic)`;

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
