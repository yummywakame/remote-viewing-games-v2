# MindSight Training

Solo practice web app for developing **MindSight** — the trained ability to perceive visual information while blindfolded (extra-ocular vision). Practice independently through voice-driven games that train color, shape, number, and card perception.

- **Production domain:** https://mindsight.training (not yet live)
- **Companion site:** https://mindsight.coach (1-on-1 coaching with Olivia Meiring)
- **Repository:** https://github.com/yummywakame/mindsight-training-webapp

## Games

| Game | Route | Status |
|---|---|---|
| Color Game | `/color-game` | Live |
| Shape Game | `/shape-game` | Live |
| Number Game | `/number-game` | Live |
| Card Game | `/card-game` | Live |

All games are stateless (no accounts, no server-side progress). User preferences are stored in browser `localStorage` only.

## Tech Stack

- **Next.js 15** (App Router) · React 18 · JavaScript
- **Tailwind CSS** · Radix UI · Framer Motion
- **STT:** Deepgram Nova-2 (via `/api/transcribe`)
- **TTS:** OpenAI `gpt-4o-mini-tts` (via `/api/speak`, with static audio cache fallback)

## Setup

```bash
npm install
cp .env.example .env.local   # then add your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Create `.env.local` from `.env.example`:

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | Yes (voice) | TTS via `/api/speak` and `audio:sync` |
| `DEEPGRAM_API_KEY` | Yes (voice) | STT via `/api/transcribe` |

Keys are server-side only — never use `NEXT_PUBLIC_` prefixes.

### Windows / OneDrive

If the project lives inside OneDrive, Next.js build artifacts can corrupt. See [AGENTS.md](AGENTS.md#windows--onedrive-dev-environment-note) for the junction-point workaround (run once after cloning).

## Scripts

```bash
npm run dev          # Dev server (port 3000)
npm run build        # Production build
npm run start        # Run production server
npm run lint         # ESLint
npm run audio:check  # Audit static TTS cache (no API key needed)
npm run audio:sync   # Generate/update static TTS files (requires .env.local)
```

## Deployment

Currently **localhost only**. Mochahost migration is in progress — see [AGENTS.md](AGENTS.md#deployment) for cPanel / Phusion Passenger steps. Static audio files in `public/audio/` are gitignored and must be uploaded separately after deploy.

## Recent Updates

- **2026-07-28:** Resolved all Dependabot security alerts — bumped Next.js to 15.5.22, dompurify to 3.4.12, postcss to 8.5.24, sharp to 0.35+, and added npm overrides for transitive deps.
- Card game live with 3-deck sprite picker, voice matching, and full static audio cache (876 phrases × 10 voices).
- Hybrid voice stack: Deepgram Nova-2 STT + OpenAI TTS with manifest-based static cache.

## Documentation

- [AGENTS.md](AGENTS.md) — full project documentation for developers and AI agents
- [VOICE_SETUP_INSTRUCTIONS.md](VOICE_SETUP_INSTRUCTIONS.md) — voice API setup details
