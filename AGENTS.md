# MindSight Training — Project Documentation for AI Agents

## What This App Is

**mindsight.training** is a solo practice web app for developing MindSight — the ability to perceive visual information while blindfolded (extra-ocular vision). Users practice independently through interactive games that train color and shape perception without using their eyes.

This is a companion app to the coaching site at **mindsight.coach**. Where mindsight.coach is for booking 1-on-1 sessions with Olivia Meiring, this app is for ongoing solo practice between sessions (and for self-guided learners).

## Repository

- **GitHub:** https://github.com/yummywakame/mindsight-training-webapp
  (Previously named `remote-viewing-games-v2`)
- **Production domain:** https://mindsight.training (not yet live)
- **Current deployment:** Vercel (`remote-viewing-games-v2.vercel.app`)
- **GitHub account:** `yummywakame`
  ```
  git config --local user.name "yummywakame"
  git config --local user.email "5927823+yummywakame@users.noreply.github.com"
  ```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | JavaScript (JSX) |
| Styling | Tailwind CSS + `tailwindcss-animate` plugin |
| UI Primitives | Radix UI (`@radix-ui/react-slot`, `@radix-ui/react-switch`) |
| Component variants | `class-variance-authority` (CVA) |
| Animations | Framer Motion 11 |
| Icons | Lucide React |
| HTML sanitization | `isomorphic-dompurify` |
| Performance | `lodash.debounce` |
| Linting | ESLint with Next.js config |
| Deployment | Vercel |

## Directory Structure

```
www/                          # Repo root
├── src/
│   ├── app/
│   │   ├── color-game/       # Color perception training game
│   │   ├── shape-game/       # Shape perception training game
│   │   ├── components/       # App-level shared components
│   │   ├── fonts/            # Custom font files
│   │   ├── globals.css       # Global stylesheet
│   │   ├── layout.js         # Root layout (applies to all routes)
│   │   ├── metadata.js       # Site metadata config
│   │   └── page.js           # Home / landing page
│   ├── components/
│   │   └── ui/               # Radix UI-based primitive components
│   ├── lib/                  # Shared library utilities
│   └── utils/                # Utility/helper functions
├── public/                   # Static assets (images, icons, etc.)
├── source/                   # Source/reference assets
├── .github/
│   └── workflows/            # GitHub Actions CI (Dependabot auto-merge etc.)
├── next.config.mjs           # Next.js configuration
├── tailwind.config.js        # Tailwind configuration
├── postcss.config.mjs        # PostCSS config (locked to v8.5.10 for compat)
├── components.json           # shadcn/ui component config
├── jsconfig.json             # JS path aliases
├── VOICE_SETUP_INSTRUCTIONS.md  # Instructions for voice/audio feature setup
├── AGENTS.md                 # This file
└── CLAUDE.md                 # Points to this file
```

## What MindSight Is — Domain Knowledge

**MindSight** (also: extra-ocular vision / EOV, blindfold vision, sight without eyes, eyeless sight, closed-eye vision, PSI vision, extravision) is the trained ability to perceive visual information without using the physical eyes. Key facts:

- A natural human capacity available to everyone — sighted or blind, adult or child
- Trainable through practice; linked to neuroplasticity, focused attention, and the pineal gland
- Not a trick, not magic — genuine perception through non-ocular pathways
- **Not** Dr. Dan Siegel's "mindsight" (an emotional intelligence concept — completely unrelated)

**Well-known teacher for reference:** Dalia Burgoin — daliaburgoin.com

## About the App

The app provides solo practice games for MindSight development. All games are **stateless** — no user accounts, no server-side saved progress.

**Note on localStorage:** The app is stateless server-side, but does persist user preferences locally in the browser via `localStorage` (never sent to a server). Managed in `src/app/components/UserPreferences.js`.

| localStorage key | Value |
|---|---|
| `userPreferencesName` | User's name (used in voice intro) |
| `userPreferencesVoiceSpeed` | TTS playback speed (default 1.2) |
| `userPreferencesVoiceName` | Selected browser voice name |
| `gameLongIntro` | `"true"` / `"false"` — full vs brief welcome message |

| Game | Route | Status |
|---|---|---|
| Color Game | `/color-game` | Live |
| Shape Game | `/shape-game` | Live |
| Number Game | `/number-game` | Planned |
| Object Game | `/object-game` | Planned |
| Word Game | `/word-game` | Planned |
| Scene Game | `/scene-game` | Planned |

Each game is designed to be used with a physical blindfold or sleep mask. The user puts on the blindfold, then attempts to perceive what is shown on screen through MindSight. The app provides feedback and progression.

**Voice features** — Audio interaction support is available (see `VOICE_SETUP_INSTRUCTIONS.md`).

## Development

```bash
npm run dev     # Start dev server at http://localhost:3000
npm run build   # Production build
npm run start   # Run production server
npm run lint    # Lint
```

**Key conventions:**
- App Router only — all routes live under `src/app/`
- Tailwind for all styling — avoid inline styles and CSS modules
- Radix UI primitives in `src/components/ui/` — use these as the base for new interactive components
- CVA (`class-variance-authority`) for component variant patterns
- Framer Motion for any animations beyond Tailwind's built-ins
- `isomorphic-dompurify` is present — use it whenever rendering any user-supplied or external HTML

## Voice Architecture

All voice logic lives in two files:
- `src/app/components/SpeechHandler.js` — `useSpeech` hook. Handles mic permission, VAD (voice activity detection), MediaRecorder clip capture, OpenAI TTS playback. Returns `{ speak, startListening, stopListening, cancelSpeech, isListening, isSpeaking }`.
- `src/app/api/transcribe/route.js` — server-side POST route; receives audio blob, calls OpenAI Whisper (`whisper-1`), returns `{ transcript }`.
- `src/app/api/speak/route.js` — server-side POST route; receives `{ text, voice, speed }`, calls OpenAI TTS (`gpt-4o-mini-tts`), returns `audio/mpeg`.

**STT:** OpenAI Whisper via VAD-driven MediaRecorder. AudioContext + AnalyserNode detects speech onset; 1.5 s of silence after speech triggers the clip send.  
**TTS:** OpenAI `gpt-4o-mini-tts`. Available voices: `alloy`, `ash`, `ballad`, `coral` (default), `echo`, `fable`, `nova`, `onyx`, `sage`, `shimmer`. Speed range 0.25–4.0.  
**Security:** `OPENAI_API_KEY` in `.env.local`, used only server-side — never in client code or `NEXT_PUBLIC_` vars.

### `handleVoiceCommand` interface

BaseGame handles common commands centrally (stop/next/skip/help/thanks) and calls:
```js
handleVoiceCommand(transcript, speak)
```
Game components (`ColorGame`, `ShapeGame`) receive `speak` as a second argument and use their own `currentItemRef.current` for game state.

## Active Work in Progress

### Voice Migration — branch: `feature/voice-openai-whisper`

**Status:** Implementation complete. Needs real-device testing and (optionally) rate limiting.

**Working:**
- TTS via OpenAI `gpt-4o-mini-tts` (coral default, warm/curious/encouraging tone)
- STT via OpenAI Whisper — VAD captures clips, sends to `/api/transcribe`
- Hallucination filter (bye, thank you, etc. discarded)
- Color background updates correctly on both voice and tap/click
- 5-min VAD idle → stops listening (resumes on next interaction)
- 2-min game inactivity → ends game (voice or tap resets timer)
- CSP allows blob audio URLs

**Open bugs / remaining work:**
- **BUG:** `Cannot find module 'react/jsx-runtime'` — `distDir` outside project root (`AppData\Local\Temp`) breaks Node module resolution at runtime. Needs a different fix for the OneDrive `.next` corruption problem (e.g. Windows junction point, or OneDrive selective sync exclusion).
- Short single-word answers ("red", "blue") should work — MIN_SPEECH_MS is 250ms — needs live testing to confirm
- Test on Chrome desktop, Safari iOS, Android Chrome
- Add rate limiting per-IP (requires Upstash Redis — see `VOICE_SETUP_INSTRUCTIONS.md`)
- Commit everything on `feature/voice-openai-whisper` branch, PR into main when stable

**Full implementation checklist:** See `VOICE_SETUP_INSTRUCTIONS.md`

## Deployment

Currently on Vercel. When the `mindsight.training` domain is connected, update:
- The Vercel project's custom domain setting
- `src/app/metadata.js` — update `metadataBase` URL and any hardcoded domain references
