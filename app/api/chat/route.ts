import { streamChat, detectIntent } from '@/lib/ai';
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
      intentData = await detectIntent(lastUserMessage.content, INTENT_DETECTION_PROMPT) as { intent: Intent; url: string | null };
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

  const encoder = new TextEncoder();

  try {
    const aiStream = await streamChat(
      messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      systemPrompt
    );

    const reader = aiStream.getReader();

    const readable = new ReadableStream({
      async start(controller) {
        if (intentData) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'intent', data: intentData })}\n\n`)
          );
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = new TextDecoder().decode(value);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'content', data: text })}\n\n`)
            );
          }
        } catch (error) {
          console.error('Stream error:', error);
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
  } catch (error) {
    console.error('Chat error:', error);
    return Response.json({ error: 'Chat failed' }, { status: 500 });
  }
}
