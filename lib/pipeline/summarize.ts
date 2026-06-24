import { chat } from '@/lib/ai';
import { scrapeWebsite } from '@/lib/scraper';
import type { ProductSummary } from '@/lib/types/video';

const SUMMARIZE_PROMPT = `You're a creative strategist for short-form video ads.

Given product info, create a creative brief. Return JSON only:
{
  "oneLiner": "One punchy sentence describing the product",
  "targetAudience": "Who this is for in one phrase",
  "coreBenefits": ["benefit1", "benefit2", "benefit3"],
  "socialHooks": ["POV hook idea 1", "relatable hook 2"],
  "vibe": "funny" | "dramatic" | "aspirational" | "chaotic" | "tutorial",
  "keywordsForBackgroundSearch": ["keyword1", "keyword2"],
  "gifSearchTerms": ["reaction type 1", "reaction type 2"]
}

Pick the vibe that will make the best TikTok/Reels ad:
- funny: relatable, self-deprecating humor
- dramatic: intense reveals, shock value
- aspirational: lifestyle upgrade, glow-up
- chaotic: fast cuts, zooms, meme energy
- tutorial: educational, how-to style

Be specific with search terms. Think trending TikTok energy.`;

export async function summarizeProduct(
  productUrl: string | null,
  productName: string | null,
  productDescription: string | null
): Promise<ProductSummary> {
  let context = '';

  if (productUrl) {
    try {
      const scraped = await scrapeWebsite(productUrl);
      context = `
URL: ${productUrl}
Title: ${scraped.title}
Description: ${scraped.description}
Content: ${scraped.headings.join('. ')}. ${scraped.paragraphs.slice(0, 5).join(' ')}
      `.trim();
    } catch {
      context = `URL: ${productUrl} (couldn't scrape, use URL context)`;
    }
  }

  if (productName) {
    context += `\nProduct Name: ${productName}`;
  }

  if (productDescription) {
    context += `\nDescription: ${productDescription}`;
  }

  if (!context.trim()) {
    context = 'Generic product video request';
  }

  const result = await chat({
    messages: [
      { role: 'system', content: SUMMARIZE_PROMPT },
      { role: 'user', content: context },
    ],
    json: true,
  });

  return JSON.parse(result);
}
