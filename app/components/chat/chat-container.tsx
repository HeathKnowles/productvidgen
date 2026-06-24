'use client';

import { useReducer, useCallback, useState } from 'react';
import type { Message, ChatState, ChatAction, ProductData, Intent, AssetSelection } from '@/lib/types';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { AssetSelector } from './asset-selector';
import { VideoGenerator } from './video-generator';

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
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);
  const [searchTerms, setSearchTerms] = useState({ video: ['lifestyle product'], gif: ['excited'] });

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
                  } else if (intent === 'select_assets' && state.productData) {
                    setShowAssetSelector(true);
                  } else if (intent === 'generate_video' && state.productData && state.assets.backgroundVideo) {
                    setShowVideoGenerator(true);
                    dispatch({ type: 'SET_PHASE', phase: 'generating' });
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

          setTimeout(() => {
            setShowAssetSelector(true);
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Scrape error:', error);
    }
  };

  const handleAssetsSelected = (assets: AssetSelection) => {
    if (assets.backgroundVideo) {
      dispatch({ type: 'SET_ASSET', key: 'backgroundVideo', asset: assets.backgroundVideo });
    }
    if (assets.gif) {
      dispatch({ type: 'SET_ASSET', key: 'gif', asset: assets.gif });
    }
    if (assets.audio) {
      dispatch({ type: 'SET_ASSET', key: 'audio', asset: assets.audio });
    }

    setShowAssetSelector(false);
    setShowVideoGenerator(true);
    dispatch({ type: 'SET_PHASE', phase: 'generating' });

    dispatch({
      type: 'ADD_MESSAGE',
      message: {
        id: generateId(),
        role: 'assistant',
        content: 'Great choices! Starting video generation now...',
        timestamp: Date.now(),
      },
    });
  };

  const handleVideoComplete = (videoUrl: string) => {
    dispatch({ type: 'SET_PHASE', phase: 'complete' });
    dispatch({
      type: 'ADD_MESSAGE',
      message: {
        id: generateId(),
        role: 'assistant',
        content: 'Your video is ready! You can preview and download it above.',
        timestamp: Date.now(),
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            UGC Video Generator
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
              {state.currentPhase}
            </span>
            {state.productData && (
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full">
                {state.productData.name}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <MessageList messages={state.messages} isLoading={state.isLoading} />

          {showAssetSelector && state.productData && (
            <div className="p-4">
              <AssetSelector
                searchTerms={searchTerms}
                onComplete={handleAssetsSelected}
              />
            </div>
          )}

          {showVideoGenerator && state.productData && state.assets.backgroundVideo && (
            <div className="p-4">
              <VideoGenerator
                productData={state.productData}
                assets={state.assets}
                onComplete={handleVideoComplete}
              />
            </div>
          )}
        </div>
      </div>

      <MessageInput
        onSend={handleSend}
        disabled={state.isLoading || showAssetSelector || showVideoGenerator}
        placeholder={
          state.currentPhase === 'gathering'
            ? 'Describe your product or paste a URL...'
            : state.currentPhase === 'assets'
            ? 'Select assets above or describe what you want...'
            : 'Your video is being generated...'
        }
      />
    </div>
  );
}
