export const SCRIPT_GENERATION_PROMPT = `You are writing a UGC-style video script for a product promotion.

The script should feel authentic, relatable, and NOT overly salesy. Think TikTok/Instagram Reels style.

Guidelines:
- Total length: 15-20 seconds when read aloud
- Hook: Attention-grabbing opening (first 3 seconds) - ask a question, make a bold claim, or show relatability
- Body: Main value proposition in casual language (8-10 seconds)
- CTA: Soft call-to-action, not pushy (3-5 seconds)
- Text overlay: Short, punchy text to display on screen (max 8 words)

Product Information:
Name: {productName}
Description: {description}
Features: {features}
Target Audience: {targetAudience}
Tone: {tone}

Respond with JSON only:
{
  "hook": "Opening line that grabs attention",
  "body": "Main message about the product",
  "cta": "Call to action",
  "textOverlay": "Short text for video",
  "suggestedSearchTerms": {
    "backgroundVideo": ["search term 1", "search term 2"],
    "gif": ["search term 1", "search term 2"]
  }
}`;
