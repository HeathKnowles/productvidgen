import { scrapeWebsite, isValidUrl } from '@/lib/scraper';
import { generateJson } from '@/lib/ai';
import { PRODUCT_EXTRACTION_PROMPT, WEBSITE_SUMMARY_PROMPT } from '@/lib/prompts/extraction';
import type { ProductData } from '@/lib/types';

export async function POST(request: Request) {
  const { url } = await request.json();

  if (!url || !isValidUrl(url)) {
    return Response.json({ error: 'Invalid URL provided' }, { status: 400 });
  }

  try {
    const scrapedContent = await scrapeWebsite(url);

    const summary = await generateJson<{
      productName: string;
      mainOffering: string;
      valueProps: string[];
      targetCustomer: string;
      brandVoice: string;
      suggestedVideoAngle: string;
    }>(
      WEBSITE_SUMMARY_PROMPT,
      `URL: ${url}\n\nTitle: ${scrapedContent.title}\n\nDescription: ${scrapedContent.description}\n\nHeadings: ${scrapedContent.headings.join(', ')}\n\nContent: ${scrapedContent.paragraphs.join('\n\n')}`
    );

    const extractedData = await generateJson<{
      name: string;
      description: string;
      features: string[];
      targetAudience: string;
      tone: 'professional' | 'casual' | 'energetic' | 'minimal';
      confidence: number;
    }>(PRODUCT_EXTRACTION_PROMPT, JSON.stringify(summary));

    const productData: ProductData = {
      ...extractedData,
      websiteUrl: url,
      imageUrls: scrapedContent.images,
    };

    return Response.json({
      success: true,
      productData,
      summary,
    });
  } catch (error) {
    console.error('Scrape error:', error);
    return Response.json(
      { error: 'Failed to scrape website' },
      { status: 500 }
    );
  }
}
