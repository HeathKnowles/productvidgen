'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  videoUrl?: string;
  status?: string;
  progress?: number;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(m =>
      m.id === id ? { ...m, ...updates } : m
    ));
  }, []);

  const appendToMessage = useCallback((id: string, text: string) => {
    setMessages(prev => prev.map(m =>
      m.id === id ? { ...m, content: m.content + text } : m
    ));
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    setIsLoading(true);

    const userMsg: Message = { id: generateId(), role: 'user', content: text };
    const assistantId = generateId();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', status: 'Thinking...' };

    setMessages(prev => [...prev, userMsg, assistantMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'text') {
              appendToMessage(assistantId, parsed.content);
              updateMessage(assistantId, { status: undefined });
            } else if (parsed.type === 'status') {
              updateMessage(assistantId, { status: parsed.stage });
            } else if (parsed.type === 'progress') {
              updateMessage(assistantId, { progress: parsed.percent });
            } else if (parsed.type === 'video') {
              updateMessage(assistantId, { videoUrl: parsed.url, status: undefined, progress: undefined });
            }
          } catch {}
        }
      }

      updateMessage(assistantId, { status: undefined, progress: undefined });
    } catch (error) {
      console.error('Chat error:', error);
      updateMessage(assistantId, { content: 'Something went wrong. Please try again!', status: undefined });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">UGC Video Generator</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Drop a product URL, get a viral video</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Create UGC Videos</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                Share your product URL and I'll create a short-form marketing video with trending audio and GIFs.
              </p>
              <div className="text-sm text-zinc-400 dark:text-zinc-500 italic">
                "I'm building CalAI, a calorie tracking app. Here's the site: calai.app"
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto py-6 space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className="px-4">
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium ${
                    msg.role === 'user'
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      : 'bg-gradient-to-br from-violet-500 to-pink-500 text-white'
                  }`}>
                    {msg.role === 'user' ? 'U' : 'AI'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>

                    {msg.status && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>{msg.status}</span>
                        {msg.progress !== undefined && <span>({msg.progress}%)</span>}
                      </div>
                    )}

                    {msg.videoUrl && (
                      <div className="mt-4 rounded-xl overflow-hidden bg-black inline-block max-w-xs">
                        <video
                          src={msg.videoUrl}
                          controls
                          playsInline
                          className="w-full aspect-[9/16]"
                        />
                        <a
                          href={msg.videoUrl}
                          download="ugc-video.mp4"
                          className="block text-center py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
                        >
                          Download Video
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
              placeholder="Describe your product or paste a URL..."
              disabled={isLoading}
              rows={1}
              className="w-full resize-none rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-4 pr-12 py-3 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 bottom-2 p-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
