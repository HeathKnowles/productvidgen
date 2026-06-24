import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function streamChat(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  systemPrompt: string
) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
  });

  return response;
}

export async function generateJson<T>(
  prompt: string,
  userContent: string
): Promise<T> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: userContent },
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from OpenAI');

  return JSON.parse(content) as T;
}
