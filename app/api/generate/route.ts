import { openai } from '@/lib/openai';
import { SCRIPT_GENERATION_PROMPT } from '@/lib/prompts/script';
import type { ProductData, AssetSelection, VideoScript } from '@/lib/types';

interface GenerateRequest {
  productData: ProductData;
  assets: AssetSelection;
}

export async function POST(request: Request) {
  const { productData, assets }: GenerateRequest = await request.json();

  if (!productData || !assets.backgroundVideo) {
    return Response.json(
      { error: 'Product data and background video are required' },
      { status: 400 }
    );
  }

  try {
    const prompt = SCRIPT_GENERATION_PROMPT
      .replace('{productName}', productData.name)
      .replace('{description}', productData.description)
      .replace('{features}', productData.features.join(', '))
      .replace('{targetAudience}', productData.targetAudience)
      .replace('{tone}', productData.tone);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: 'Generate the video script now.' },
      ],
      response_format: { type: 'json_object' },
    });

    const script: VideoScript = JSON.parse(
      response.choices[0]?.message?.content || '{}'
    );

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    return Response.json({
      success: true,
      jobId,
      script,
      assets,
      productData,
    });
  } catch (error) {
    console.error('Generation error:', error);
    return Response.json(
      { error: 'Failed to generate video script' },
      { status: 500 }
    );
  }
}
