export const PRODUCT_EXTRACTION_PROMPT = `You are extracting product information from website content or user descriptions.

Extract and structure the following information:
- Product/brand name
- Description (what it is, what it does)
- Key features (list 3-5)
- Target audience (who would buy this)
- Suggested tone for video (professional, casual, energetic, or minimal)

If information is missing, make reasonable inferences based on context but mark them as inferred.

Respond with JSON only:
{
  "name": "Product Name",
  "description": "Brief description",
  "features": ["feature 1", "feature 2", "feature 3"],
  "targetAudience": "Who this is for",
  "tone": "casual",
  "confidence": 0.0-1.0
}`;

export const WEBSITE_SUMMARY_PROMPT = `You are summarizing a scraped website for product information extraction.

Focus on:
- What product or service is being offered
- Key value propositions
- Target customer base
- Brand personality/voice

Ignore:
- Navigation elements
- Footer content
- Cookie notices
- Generic marketing fluff

Provide a structured summary that can be used to create a UGC video about this product.

Respond with JSON:
{
  "productName": "name",
  "mainOffering": "what they sell",
  "valueProps": ["prop1", "prop2"],
  "targetCustomer": "who buys this",
  "brandVoice": "how they communicate",
  "suggestedVideoAngle": "what aspect to highlight in video"
}`;
