# UGC Video Generator

A chat-based tool that creates short-form meme marketing videos from product descriptions or URLs.

Drop a product URL, get a viral video.

## What It Does

You describe your product in natural language. The system:
1. Understands what you're selling
2. Writes a funny meme caption
3. Finds a matching background video, reaction GIF, and trending audio
4. Composites everything into a 7-second vertical video
5. Returns it in the same chat

The output mimics the low-effort, high-engagement meme format that performs well on TikTok and Reels.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Chat UI                              │
│                   (React, streaming)                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    /api/chat                                │
│                                                             │
│  1. Parse message → Is this a video request?                │
│  2. If not → Stream conversational response (Groq)          │
│  3. If yes → Run pipeline                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Pipeline                                 │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Scrape     │  │  Summarize   │  │    Plan      │      │
│  │   Website    │→ │   Product    │→ │    Video     │      │
│  │   (cheerio)  │  │   (Groq)     │  │   (Groq)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                              │               │
│                                              ▼               │
│                    ┌─────────────────────────────────────┐  │
│                    │         Resolve Assets              │  │
│                    │                                     │  │
│                    │  Background: Pexels API             │  │
│                    │  Meme/GIF:   GIPHY        │  │
│                    │  Audio:      TikTok + Freesound     │  │
│                    └─────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 Client-Side Renderer                        │
│                                                             │
│  Canvas API + MediaRecorder                                 │
│  - Draw background video frame by frame                     │
│  - Overlay meme text (Impact font, stroke)                  │
│  - Overlay reaction image (centered, framed)                │
│  - Capture to WebM blob                                     │
└─────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

### Why client-side rendering?

FFmpeg WASM had cross-origin and Turbopack compatibility issues. Canvas + MediaRecorder:
- Works in all modern browsers
- No WASM loading delays
- Simpler debugging
- Produces WebM (widely supported)

Tradeoff: No hardware acceleration, limited to real-time rendering.

### Why Groq over OpenAI?

Speed. Groq returns responses in ~500ms vs 2-3s for GPT-4. For a chat UX where users expect quick feedback, this matters. Falls back to OpenRouter if Groq fails.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 | App router, streaming, API routes |
| AI | Groq (llama-3.3-70b) | Fast inference |
| Video BG | Pexels API | Free, quality stock footage |
| Memes | Reddit Meme API | Actually funny content |
| Audio | TikTok sounds + Freesound | Trending + SFX |
| Rendering | Canvas + MediaRecorder | Browser-native, no deps |
| Styling | Tailwind v4 | Rapid UI iteration |

## Setup

```bash
# Install
npm install

# Environment variables
cp .env.example .env.local
# Add: GROQ_API_KEY, PEXELS_API_KEY

# Run
npm run dev
```

## What's Missing

Things I'd add with more time:

1. **Server-side rendering** - Use Remotion's render API for higher quality output and GIF animation support
2. **Asset preview** - Let users pick from multiple background/meme options before rendering
3. **Template variety** - Different layouts for different vibes (clean-ugc, chaotic, tutorial)
4. **Trending audio integration** - Pull actual trending TikTok sounds instead of searching
5. **Export formats** - MP4 download, direct posting to socials

## File Structure

```
lib/
├── ai/              # Groq client, streaming
├── assets/          # Pexels, memes, audio resolvers  
├── audio/           # TikTok + Freesound audio
├── pipeline/        # Orchestrates scrape → plan → assets → compose
├── scraper/         # Website content extraction
├── video/
│   ├── generator.ts # Canvas-based video renderer
│   └── remotion/    # Remotion components (for future SSR)
└── types/           # TypeScript interfaces

app/
├── api/
│   └── chat/        # Main streaming endpoint
└── components/
    └── chat/        # Chat UI, video renderer component
```

## The Core Insight

UGC videos aren't about production quality. They're about:
1. Speed (make 10 videos, see what hits)
2. Humor (self-aware > polished)
3. Format (follow what's working now)

This tool optimizes for iteration speed over perfection.
