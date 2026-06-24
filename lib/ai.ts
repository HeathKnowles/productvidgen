import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

interface ChatOptions {
  messages: Message[];
  stream?: boolean;
  json?: boolean;
}

async function callOpenRouter(
  messages: Message[],
  options: { json?: boolean; stream?: boolean } = {}
) {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'UGC Video Generator',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-8b-instruct:free',
      messages,
      stream: options.stream || false,
      ...(options.json && { response_format: { type: 'json_object' } }),
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status}`);
  }

  return response;
}

export async function chat(options: ChatOptions): Promise<string> {
  const { messages, json = false } = options;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      ...(json && { response_format: { type: 'json_object' } }),
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq failed, falling back to OpenRouter:', error);

    if (!OPENROUTER_API_KEY) {
      throw new Error('No fallback API key configured');
    }

    const response = await callOpenRouter(messages, { json });
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }
}

export async function streamChat(
  messages: Message[],
  systemPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  const allMessages: Message[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: allMessages,
      stream: true,
    });

    const encoder = new TextEncoder();

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
  } catch (error) {
    console.error('Groq streaming failed, falling back to OpenRouter:', error);

    if (!OPENROUTER_API_KEY) {
      throw new Error('No fallback API key configured');
    }

    const response = await callOpenRouter(allMessages, { stream: true });

    if (!response.body) {
      throw new Error('No response body from OpenRouter');
    }

    return response.body;
  }
}

export async function generateJson<T>(
  prompt: string,
  userContent: string
): Promise<T> {
  const result = await chat({
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: userContent },
    ],
    json: true,
  });

  return JSON.parse(result) as T;
}

export async function detectIntent(
  message: string,
  intentPrompt: string
): Promise<{ intent: string; url: string | null; confidence: number }> {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: intentPrompt },
        { role: 'user', content: message },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}');
  } catch (error) {
    console.error('Intent detection failed:', error);
    return { intent: 'ask_question', url: null, confidence: 0.5 };
  }
}
