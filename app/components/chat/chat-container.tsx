'use client';

import { useReducer, useCallback } from 'react';
import type { Message, ChatState, ChatAction, ProductData, Intent } from '@/lib/types';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  currentPhase: 'gathering',
  productData: null,
  assets: {},
  videoJob: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, content: m.content + action.content } : m
        ),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'SET_PHASE':
      return { ...state, currentPhase: action.phase };
    case 'SET_PRODUCT_DATA':
      return { ...state, productData: action.data };
    case 'SET_ASSET':
      return { ...state, assets: { ...state.assets, [action.key]: action.asset } };
    case 'SET_VIDEO_JOB':
      return { ...state, videoJob: action.job };
    case 'UPDATE_VIDEO_JOB':
      return {
        ...state,
        videoJob: state.videoJob ? { ...state.videoJob, ...action.updates } : null,
      };
    default:
      return state;
  }
}

function generateId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function ChatContainer() {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const handleSend = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      dispatch({ type: 'ADD_MESSAGE', message: userMessage });
      dispatch({ type: 'SET_LOADING', isLoading: true });

      const assistantId = generateId();
      dispatch({
        type: 'ADD_MESSAGE',
        message: {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
        },
      });

      try {
        const chatMessages = [...state.messages, userMessage].map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: chatMessages,
            context: {
              phase: state.currentPhase,
              productData: state.productData,
              assets: state.assets,
            },
          }),
        });

        if (!response.ok) throw new Error('Chat request failed');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let intentHandled = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === 'intent' && !intentHandled) {
                  intentHandled = true;
                  const intent = parsed.data.intent as Intent;
                  const url = parsed.data.url as string | null;

                  if (intent === 'provide_url' && url) {
                    handleUrlProvided(url);
                  }
                } else if (parsed.type === 'content') {
                  dispatch({ type: 'UPDATE_MESSAGE', id: assistantId, content: parsed.data });
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      } catch (error) {
        console.error('Chat error:', error);
        dispatch({
          type: 'UPDATE_MESSAGE',
          id: assistantId,
          content: 'Sorry, something went wrong. Please try again.',
        });
      } finally {
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    },
    [state.messages, state.currentPhase, state.productData, state.assets]
  );

  const handleUrlProvided = async (url: string) => {
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const { productData } = await response.json();
        if (productData) {
          dispatch({ type: 'SET_PRODUCT_DATA', data: productData as ProductData });
          dispatch({ type: 'SET_PHASE', phase: 'assets' });
        }
      }
    } catch (error) {
      console.error('Scrape error:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            UGC Video Generator
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Phase: {state.currentPhase}
            </span>
            {state.productData && (
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full">
                {state.productData.name}
              </span>
            )}
          </div>
        </div>
      </header>

      <MessageList messages={state.messages} isLoading={state.isLoading} />

      <MessageInput onSend={handleSend} disabled={state.isLoading} />
    </div>
  );
}
