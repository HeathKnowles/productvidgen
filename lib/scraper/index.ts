import { scrapeWithCheerio, type ScrapedContent } from './cheerio';

export type { ScrapedContent };

function needsJsRendering(content: ScrapedContent): boolean {
  const hasMinimalContent =
    content.paragraphs.length < 3 &&
    content.headings.length < 2 &&
    content.rawText.length < 500;

  const hasSpaIndicators =
    content.rawText.includes('Loading') ||
    content.rawText.includes('JavaScript') ||
    content.title.includes('React App') ||
    content.title.includes('Angular');

  return hasMinimalContent || hasSpaIndicators;
}

export async function scrapeWebsite(url: string): Promise<ScrapedContent> {
  const cheerioResult = await scrapeWithCheerio(url);

  if (needsJsRendering(cheerioResult)) {
    console.log(
      'Content looks incomplete, would use Playwright for JS rendering'
    );
  }

  return cheerioResult;
}

export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
