import { generateJson } from '@/lib/ai';
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

    const script = await generateJson<VideoScript>(
      prompt,
      'Generate the video script now.'
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
