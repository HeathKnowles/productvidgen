import * as cheerio from 'cheerio';

export interface ScrapedContent {
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  links: { text: string; href: string }[];
  images: string[];
  rawText: string;
}

export async function scrapeWithCheerio(url: string): Promise<ScrapedContent> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  $('script, style, noscript, iframe, nav, footer, header').remove();

  const title = $('title').text().trim() || $('h1').first().text().trim();

  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';

  const headings: string[] = [];
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 200) {
      headings.push(text);
    }
  });

  const paragraphs: string[] = [];
  $('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 20 && text.length < 1000) {
      paragraphs.push(text);
    }
  });

  const links: { text: string; href: string }[] = [];
  $('a').each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href');
    if (text && href && !href.startsWith('#') && text.length < 100) {
      links.push({ text, href });
    }
  });

  const images: string[] = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (src && !src.includes('data:image')) {
      const absoluteUrl = src.startsWith('http')
        ? src
        : new URL(src, url).toString();
      images.push(absoluteUrl);
    }
  });

  const rawText = $('body')
    .text()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000);

  return {
    title,
    description,
    headings: headings.slice(0, 10),
    paragraphs: paragraphs.slice(0, 20),
    links: links.slice(0, 20),
    images: images.slice(0, 10),
    rawText,
  };
}
