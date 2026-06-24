import { scrapeWebsite, isValidUrl } from '@/lib/scraper';
import { openai } from '@/lib/openai';
import { PRODUCT_EXTRACTION_PROMPT, WEBSITE_SUMMARY_PROMPT } from '@/lib/prompts/extraction';
import type { ProductData } from '@/lib/types';

export async function POST(request: Request) {
  const { url } = await request.json();

  if (!url || !isValidUrl(url)) {
    return Response.json({ error: 'Invalid URL provided' }, { status: 400 });
  }

  try {
    const scrapedContent = await scrapeWebsite(url);

    const summaryResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: WEBSITE_SUMMARY_PROMPT },
        {
          role: 'user',
          content: `URL: ${url}\n\nTitle: ${scrapedContent.title}\n\nDescription: ${scrapedContent.description}\n\nHeadings: ${scrapedContent.headings.join(', ')}\n\nContent: ${scrapedContent.paragraphs.join('\n\n')}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const summary = JSON.parse(summaryResponse.choices[0]?.message?.content || '{}');

    const extractionResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PRODUCT_EXTRACTION_PROMPT },
        {
          role: 'user',
          content: JSON.stringify(summary),
        },
      ],
      response_format: { type: 'json_object' },
    });

    const productData: ProductData = {
      ...JSON.parse(extractionResponse.choices[0]?.message?.content || '{}'),
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
