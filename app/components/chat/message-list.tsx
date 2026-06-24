'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/lib/types';
import { MessageBubble } from './message-bubble';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Create Your UGC Video
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Tell me about your product or paste a website URL to get started
            </p>
          </div>
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-3">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.1s]" />
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
