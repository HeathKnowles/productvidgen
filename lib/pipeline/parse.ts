import { chat } from '@/lib/ai';
import type { ProductRequest } from '@/lib/types/video';

const PARSE_PROMPT = `You analyze user messages for a UGC video generator.

Classify the message and extract product info. Return JSON only:
{
  "isVideoRequest": boolean,
  "productName": string | null,
  "productUrl": string | null,
  "productDescription": string | null,
  "needsMoreInfo": boolean,
  "followUpQuestion": string | null
}

Rules:
- isVideoRequest = true if user wants a video, mentions a product/app/business, or shares a URL
- Extract any URL (add https:// if missing)
- needsMoreInfo = true only if they want a video but gave no product details or URL
- followUpQuestion should be short and specific like "What's your product URL?" or "What does your app do?"

Examples:
- "hi" → isVideoRequest: false
- "make me a video" → isVideoRequest: true, needsMoreInfo: true, followUpQuestion: "What product should I make a video for?"
- "I'm building CalAI, calai.app" → isVideoRequest: true, productName: "CalAI", productUrl: "https://calai.app"`;

export async function parseUserMessage(message: string): Promise<ProductRequest> {
  const result = await chat({
    messages: [
      { role: 'system', content: PARSE_PROMPT },
      { role: 'user', content: message },
    ],
    json: true,
  });

  return JSON.parse(result);
}
