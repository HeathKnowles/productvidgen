import { chat, streamChat } from '@/lib/ai';
import { parseMessage, runPipeline } from '@/lib/pipeline';
import { renderVideo } from '@/lib/video/render';

const SYSTEM_PROMPT = `You are a friendly UGC video assistant. You create short-form marketing videos.

Guidelines:
- Be conversational and warm like ChatGPT
- Keep responses short (1-3 sentences)
- For greetings: respond naturally, mention you create UGC videos
- For "what can you do": explain you create short marketing videos from product URLs
- For product/URL messages: be enthusiastic, say you're creating their video

Never use bullet points. Be natural and brief.`;

export async function POST(request: Request) {
  const { message, history = [] } = await request.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
      };

      try {
        const parsed = await parseMessage(message);

        if (!parsed.isVideoRequest) {
          const aiStream = await streamChat(
            [...history.slice(-6), { role: 'user' as const, content: message }],
            SYSTEM_PROMPT
          );
          const reader = aiStream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            send('text', { content: new TextDecoder().decode(value) });
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        if (parsed.needsMoreInfo) {
          send('text', { content: parsed.followUpQuestion || "What product should I create a video for? Share a URL or describe it." });
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          return;
        }

        const productName = parsed.productName || 'your product';
        send('text', { content: `Got it! I'm creating a UGC video for ${productName}. This will take about 30 seconds...\n\n` });

        const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

        const { composition, summary, plan } = await runPipeline(parsed, (status) => {
          send('status', { stage: status });
        });

        send('status', { stage: 'Rendering video...' });

        const outputUrl = await renderVideo(composition, jobId, (progress) => {
          send('progress', { percent: progress });
        });

        send('text', { content: `\n\nHere's your video! I went with a "${plan.visualStyle}" style, using the hook "${plan.hookText}" to grab attention. The ${composition.assets.musicName} track adds the perfect vibe.` });
        send('video', { url: outputUrl });

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        console.error('Pipeline error:', error);
        send('text', { content: 'Sorry, something went wrong creating your video. Please try again!' });
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
