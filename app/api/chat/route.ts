import { openai } from '@/lib/openai';
import { CHAT_SYSTEM_PROMPT, INTENT_DETECTION_PROMPT } from '@/lib/prompts/intent';
import type { ProductData, AssetSelection, ChatPhase, Intent } from '@/lib/types';

interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  context: {
    phase: ChatPhase;
    productData: ProductData | null;
    assets: AssetSelection;
  };
}

export async function POST(request: Request) {
  const { messages, context }: ChatRequest = await request.json();

  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();

  let intentData: { intent: Intent; url: string | null } | null = null;
  if (lastUserMessage) {
    try {
      const intentResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: INTENT_DETECTION_PROMPT },
          { role: 'user', content: lastUserMessage.content },
        ],
        response_format: { type: 'json_object' },
      });
      intentData = JSON.parse(intentResponse.choices[0]?.message?.content || '{}');
    } catch {
      console.error('Intent detection failed');
    }
  }

  const systemPrompt = CHAT_SYSTEM_PROMPT
    .replace('{phase}', context.phase)
    .replace(
      '{productInfo}',
      context.productData ? JSON.stringify(context.productData) : 'None yet'
    )
    .replace(
      '{assets}',
      Object.keys(context.assets).length > 0
        ? JSON.stringify(context.assets)
        : 'None selected'
    );

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ],
    stream: true,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      if (intentData) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'intent', data: intentData })}\n\n`)
        );
      }

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'content', data: content })}\n\n`)
          );
        }
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
