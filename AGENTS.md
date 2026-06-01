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

Voice logic is split across two files — both need to be understood before editing either:
- `src/app/components/SpeechHandler.js` — the main voice component (STT + TTS)
- `src/app/components/BaseGame.js` — also contains a duplicate speech recognition singleton (lines ~480–585); this should eventually be consolidated into `SpeechHandler.js`

Current TTS (`window.speechSynthesis`) works. Current STT (`webkitSpeechRecognition`) is broken — returns a "network" error because it depends on Google's servers. See `VOICE_SETUP_INSTRUCTIONS.md` for full context and the migration plan.

## Active Work in Progress

### Voice Migration — branch: `feature/voice-openai-whisper`

**Goal:** Replace broken Web Speech API STT with OpenAI Whisper via a protected Next.js API route.

**Decisions made:**
- **STT:** OpenAI Whisper (`gpt-4o-mini-transcribe`, $0.003/min) — send captured audio clips to `/api/transcribe` route
- **TTS:** Keep existing `window.speechSynthesis` for now; optionally upgrade to OpenAI `gpt-4o-mini-tts` later
- **Security:** API key lives in `.env.local` and is called only from server-side API routes — never exposed to the browser
- **Word matching:** Whisper returns full transcript as plain text; use `transcript.toLowerCase().includes(targetWord)` to find the answer word anywhere in the phrase (handles "hmm is it yellow?", background chatter, etc.)
- **Approach:** Pre-recorded/batch (not streaming) — capture clip after silence, send to Whisper, get transcript back in ~300ms. Cheaper and sufficient for this use case.

**OpenAI account status:** Account exists at platform.openai.com. Billing credits need to be added before the API will work. API key needs to be created and added to `.env.local` as `OPENAI_API_KEY`.

**Full implementation checklist:** See `VOICE_SETUP_INSTRUCTIONS.md`

## Deployment

Currently on Vercel. When the `mindsight.training` domain is connected, update:
- The Vercel project's custom domain setting
- `src/app/metadata.js` — update `metadataBase` URL and any hardcoded domain references
