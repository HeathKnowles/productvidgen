'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { VideoComposition } from '@/lib/types/video';

const VideoRenderer = dynamic(
  () => import('./video-renderer').then(mod => mod.VideoRenderer),
  { ssr: false }
);

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  videoUrl?: string;
  isRendering?: boolean;
  renderStage?: string;
  renderProgress?: number;
  composition?: VideoComposition;
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [renderingMessageId, setRenderingMessageId] = useState<string | null>(null);
  const [activeComposition, setActiveComposition] = useState<VideoComposition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const appendToMessage = useCallback((id: string, text: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: m.content + text } : m));
  }, []);

  const handleRenderProgress = useCallback((stage: string, progress: number) => {
    if (renderingMessageId) {
      updateMessage(renderingMessageId, { renderStage: stage, renderProgress: progress });
    }
  }, [renderingMessageId, updateMessage]);

  const handleRenderComplete = useCallback((url: string) => {
    if (renderingMessageId) {
      updateMessage(renderingMessageId, {
        videoUrl: url,
        isRendering: false,
        renderStage: undefined,
        renderProgress: undefined,
      });
    }
    setRenderingMessageId(null);
    setActiveComposition(null);
  }, [renderingMessageId, updateMessage]);

  const handleRenderError = useCallback((error: string) => {
    if (renderingMessageId) {
      appendToMessage(renderingMessageId, `\n\n(Video rendering failed: ${error})`);
      updateMessage(renderingMessageId, { isRendering: false });
    }
    setRenderingMessageId(null);
    setActiveComposition(null);
  }, [renderingMessageId, appendToMessage, updateMessage]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    setIsLoading(true);

    const userMsg: Message = { id: generateId(), role: 'user', content: text };
    const assistantId = generateId();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '' };

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
      let compositionToRender: VideoComposition | null = null;

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
            } else if (parsed.type === 'status') {
              updateMessage(assistantId, { renderStage: parsed.stage });
            } else if (parsed.type === 'render') {
              compositionToRender = parsed.composition as VideoComposition;
            }
          } catch {}
        }
      }

      if (compositionToRender) {
        updateMessage(assistantId, { isRendering: true, renderStage: 'Starting render...' });
        setRenderingMessageId(assistantId);
        setActiveComposition(compositionToRender);
      }
    } catch (error) {
      console.error('Chat error:', error);
      updateMessage(assistantId, { content: 'Something went wrong. Please try again!' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950">
      {activeComposition && (
        <VideoRenderer
          composition={activeComposition}
          onProgress={handleRenderProgress}
          onComplete={handleRenderComplete}
          onError={handleRenderError}
        />
      )}

      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">UGC Video Generator</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Drop a product URL, get a viral video</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-linear-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">Create UGC Videos</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Share your product URL and I'll create a short-form marketing video with trending audio, GIFs, and catchy text.
              </p>
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Try saying:</p>
                <p className="text-zinc-700 dark:text-zinc-300 italic">
                  "I'm building CalAI, a calorie tracking app. Here's the site: calai.app"
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto py-6 space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className="px-4">
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold ${
                    msg.role === 'user'
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      : 'bg-linear-to-br from-violet-500 to-pink-500 text-white'
                  }`}>
                    {msg.role === 'user' ? 'U' : 'AI'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>

                    {(msg.isRendering || msg.renderStage) && !msg.videoUrl && (
                      <div className="mt-4 bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10">
                            <div className="absolute inset-0 rounded-full border-2 border-violet-200 dark:border-violet-800" />
                            <div className="absolute inset-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                              {msg.renderStage || 'Processing...'}
                            </p>
                            {msg.renderProgress !== undefined && (
                              <div className="mt-2 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-linear-to-r from-violet-500 to-pink-500 transition-all duration-300"
                                  style={{ width: `${msg.renderProgress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {msg.videoUrl && (
                      <div className="mt-4 rounded-xl overflow-hidden bg-black inline-block shadow-xl max-w-xs">
                        <video
                          src={msg.videoUrl}
                          controls
                          playsInline
                          autoPlay
                          muted
                          className="w-full aspect-9/16"
                        />
                        <a
                          href={msg.videoUrl}
                          download="ugc-video.mp4"
                          className="flex items-center justify-center gap-2 py-3 bg-linear-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white text-sm font-semibold transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
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
      <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="relative">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
              placeholder="Describe your product or paste a URL..."
              disabled={isLoading}
              rows={1}
              className="w-full resize-none rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-4 pr-14 py-3.5 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 bottom-2 p-2.5 rounded-lg bg-linear-to-r from-violet-600 to-pink-600 text-white hover:from-violet-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
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
