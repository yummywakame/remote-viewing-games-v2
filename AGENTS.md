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
| Deployment | Vercel (temporary — migrating to Mochahost) |
| STT | Deepgram Nova-2 (batch REST via `/api/transcribe`) |
| TTS | OpenAI `gpt-4o-mini-tts` (via `/api/speak`) |

## Directory Structure

```
www/                          # Repo root
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── speak/        # POST: OpenAI gpt-4o-mini-tts → audio/mpeg
│   │   │   └── transcribe/   # POST: audio blob → Deepgram Nova-2 transcript
│   │   ├── color-game/       # Color perception training game
│   │   ├── shape-game/       # Shape perception training game
│   │   ├── components/       # App-level shared components
│   │   ├── fonts/            # Custom font files
│   │   ├── globals.css       # Global stylesheet
│   │   ├── layout.js         # Root layout (applies to all routes)
│   │   ├── metadata.js       # Site metadata config
│   │   └── page.js           # Home / landing page
│   ├── components/
│   │   ├── BaseGame.js       # Shared game shell — owns all prefs state, voice flow, buttons, settings modal
│   │   ├── ColorGame.js      # Color game — provides matchItem, itemTable, COLOR_ALIASES, QUESTION_VARIANTS
│   │   ├── ShapeGame.js      # Shape game — provides matchItem, itemTable, SHAPE_ALIASES, QUESTION_VARIANTS
│   │   ├── GameSettings.js   # Shared settings modal shell (new — replaces duplicate in each game)
│   │   ├── ColorGameSettings.js  # Thin wrapper: passes renderItem (color swatch) to GameSettings
│   │   ├── ShapeGameSettings.js  # Thin wrapper: passes renderItem (shape SVG) to GameSettings
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
| `userPreferencesName` | User's name (used in voice intro and outro) |
| `userPreferencesVoiceSpeed` | TTS playback speed (default 1.2) |
| `userPreferencesVoiceName` | Selected OpenAI voice name (default `echo`) |
| `gameLongIntro` | `"true"` / `"false"` — full vs brief welcome message |
| `gameAutoAdvance` | `"true"` / `"false"` — auto-advance to next item after correct guess (default `"true"`) |
| `colorGameSelectedItems` | JSON array of active colors |
| `shapeGameSelectedItems` | JSON array of active shapes |

| Game | Route | Status |
|---|---|---|
| Color Game | `/color-game` | Live |
| Shape Game | `/shape-game` | Live |
| Number Game | `/number-game` | Planned |
| Object Game | `/object-game` | Planned |
| Word Game | `/word-game` | Planned |
| Scene Game | `/scene-game` | Planned |

Each game is designed to be used with a physical blindfold or sleep mask. The user puts on the blindfold, then attempts to perceive what is shown on screen through MindSight. The app provides feedback and progression.

## Development

```bash
npm run dev     # Start dev server at http://localhost:3000
npm run build   # Production build
npm run start   # Run production server
npm run lint    # Lint
```

**Key conventions:**
- App Router only — all routes live under `src/app/`
- **`UserPreferences.js` — stale closure trap:** `handleSave` is a `useCallback`. Every preference state variable it writes to localStorage (`name`, `speed`, `voice`, `longIntroEnabled`, `autoAdvance`, and any future additions) **must** appear in the dependency array, or `handleSave` will capture a stale initial value and silently save the wrong thing. This has caused bugs multiple times. When adding a new preference, always add it to both the `localStorage.setItem` block AND the `useCallback` dep array in the same commit.
- Tailwind for all styling — avoid inline styles and CSS modules
- Radix UI primitives in `src/components/ui/` — use these as the base for new interactive components
- CVA (`class-variance-authority`) for component variant patterns
- Framer Motion for any animations beyond Tailwind's built-ins
- `isomorphic-dompurify` is present — use it whenever rendering any user-supplied or external HTML

### Windows / OneDrive dev environment note

The project lives inside OneDrive. OneDrive corrupts Next.js `.next` build artefacts (symlinks, case-sensitive paths). The fix is **two Windows junction points** (transparent to OneDrive and Node.js):

```powershell
# Run once after cloning, or if .next is missing/broken
New-Item -ItemType Directory -Force "C:\Users\olivi\AppData\Local\Temp\nextjs-mindsight\.next"
New-Item -ItemType Junction -Path ".next" -Target "C:\Users\olivi\AppData\Local\Temp\nextjs-mindsight\.next"
New-Item -ItemType Junction -Path "C:\Users\olivi\AppData\Local\Temp\nextjs-mindsight\node_modules" -Target "$(pwd)\node_modules"
```

`next.config.mjs` uses the default `distDir` (`.next`) — no custom path needed.

## Voice Architecture

All voice logic lives in these files:
- `src/app/components/SpeechHandler.js` — `useSpeech` hook. Handles mic permission, VAD (voice activity detection), MediaRecorder clip capture, OpenAI TTS playback, and in-memory TTS cache. Returns `{ speak, startListening, stopListening, cancelSpeech, isListening, isSpeaking }`.
- `src/app/api/transcribe/route.js` — server-side POST route; receives audio blob, calls Deepgram Nova-2 batch REST, returns `{ transcript }`.
- `src/app/api/speak/route.js` — server-side POST route; receives `{ text, voice, speed }`, calls OpenAI TTS (`gpt-4o-mini-tts`), returns `audio/mpeg`.

**STT:** Deepgram Nova-2 via batch REST. Browser VAD (AudioContext + AnalyserNode) detects speech onset; 800ms of silence triggers clip send to `/api/transcribe`, which proxies to Deepgram. No browser WebSocket — all API calls are server-side. Transcription latency ~300ms (vs ~1.5s with Whisper).
**TTS:** OpenAI `gpt-4o-mini-tts`. Default voice: `echo`. Speed default: 1.2. Available voices: `alloy`, `ash`, `ballad`, `coral`, `echo`, `fable`, `nova`, `onyx`, `sage`, `shimmer`. Speed range 0.25–4.0. Tone: jovial, upbeat, playful — emphasises ALL CAPS words.
**TTS cache:** `speak()` caches audio `Blob` objects in memory keyed by text. Repeated phrases (question variants, try-again, outro) cost 0 API calls after the first play. Cache is cleared when voice or speed changes.
**Security:** `OPENAI_API_KEY` and `DEEPGRAM_API_KEY` in `.env.local`, used only server-side — never in client code or `NEXT_PUBLIC_` vars.
**Expected latency:** ~800ms VAD silence wait + ~300ms Deepgram transcription = ~1.1s total (down from ~2.3s with Whisper).

### VAD tuning constants (`SpeechHandler.js`)

| Constant | Value | Purpose |
|---|---|---|
| `SPEECH_THRESHOLD` | 15 RMS | Lower threshold catches plosive-onset words ("pink") |
| `MIN_SPEECH_MS` | 100ms | Time since first onset before confirming as speech |
| `SILENCE_DURATION_MS` | 800ms | Silence after speech → send clip to Deepgram |
| `VAD_INTERVAL_MS` | 100ms | How often VAD polls the analyser |
| `MAX_CLIP_MS` | 10000ms | Force-rotate recording after this long |
| `IDLE_TIMEOUT_MS` | 5 min | Stop listening after no confirmed speech |

**Key VAD behaviour:** The burst timer (`speechStartTimeRef`) is only reset after 150ms of sustained silence — brief dips during short crisp words do not interrupt accumulation. Speech confirmation is checked outside the threshold block so elapsed time counts through dips.

### Hallucination filter

Deepgram is much less prone to hallucinations than Whisper, but a small filter is kept as a safety net. Discards a transcript if every sentence (split on `.!?`) is a known filler phrase. Known phrases: bye, goodbye, thank you, thanks, see you, you're welcome, thank you for watching.

### `matchItem` interface

BaseGame handles common commands centrally (stop/next/skip/help) and calls:
```js
const matched = matchItem(transcript, speak)
// matched: { item: string, isCorrect: true|false|null } | null
```

- `isCorrect === true` → BaseGame speaks a CORRECT_RESPONSES entry, then advances to next item and asks the next question.
- `isCorrect === false` → BaseGame speaks a TRY_AGAIN_RESPONSES entry.
- `isCorrect === null` → special command (show me / hint) already spoken inside `matchItem`; BaseGame just resets the inactivity timer.
- `null` → nothing matched; inactivity timer is NOT reset.

Game components also pass `displayItem` for grammatical articles (e.g. ShapeGame returns `displayItem: "a circle"` so correct responses say "It IS a circle!" not "It IS circle!").

The inactivity timer only resets on recognised game items or navigation commands — background noise transcripts do not keep the game alive.

## Game Response Variations

`CORRECT_RESPONSES` and `TRY_AGAIN_RESPONSES` live in `BaseGame.js` (shared). `COLOR_ALIASES` and `QUESTION_VARIANTS` live in `ColorGame.js`. `SHAPE_ALIASES` and `QUESTION_VARIANTS` live in `ShapeGame.js`.

### ColorGame — `COLOR_ALIASES`
Whisper often mishears short color words. Aliases use word-boundary regex matching:

| Color | Aliases |
|---|---|
| red | raid, reed, read, rad, bread, rick, great |
| yellow | gielo, jello |
| purple | pebble, pebbles |
| orange | french |
| blue | okay |

Both active and inactive colors are checked — saying any color name (even a deselected one) triggers a "try again" response.

### Correct responses — `BaseGame.js` (cycle in order, shared by all games)
Functions take `(item, display?)` — `display` is used when an article is needed (e.g. "a circle").
1. `Correct! It IS [display]!`
2. `Yes, it's [display]!`
3. `Well done! [Display]!`
4. `Yes, [display]!`
5. `You nailed it! It's [display]!`
6. `Yep, it's [display]!`
7. `It IS [display]!`
8. `[Display] it is!`

### Try-again responses — `BaseGame.js` (random, shared by all games)
Not this time — keep sensing! / Almost! Give it another go. / Not quite! Keep going, you've got this! / Not quite — what else do you pick up? / Give it another try! / You're getting there — try again!

### Question variants (random after first; first is always fixed)
**ColorGame:** What color is this? / Next. What color do you see? / Next. Can you tell what color this is? / Next. What about this one? / Next. And this one? / Next. How about this one? / Next. What do you sense?
**ShapeGame:** same set with "shape" in place of "color".
The first question on game start is always hardcoded in `BaseGame.startGame` (`"What [gameType] is this?"`). Subsequent questions use the variants array randomly.

### ShapeGame — `SHAPE_ALIASES`
Initial phonetic guesses — test and refine during real play (Deepgram may mishear differently):

| Shape | Aliases |
|---|---|
| triangle | try angle, trying, try angel, tri angle |
| square | scare, squire, swear, squared |
| circle | surgical, surreal, circles, circled |
| oval | over, opal, able, oh well |
| diamond | die man, diamonds, diemond |
| star | store, scar, stare, start, stars |

### Outro responses (`BaseGame.js` — cycles with name)
- `Thanks [name]! That was fun.` / `Thank you for playing!`
- `Thanks [name]! I hope we play again soon.` / `Great session — thanks for playing!`
- `That was a good practice session, [name]!` / `That was a great practice session!`

**Timeout:** always says `"I haven't heard from you in a while. Goodbye!"`

### Timers
- **2-min game inactivity** → ends game with timeout message (only resets on recognised items/commands, not background noise)
- **5-min VAD idle** → stops listening (restarts on next interaction)

## Alternative Voice Providers (for future consideration)

### STT alternatives to OpenAI Whisper

| Provider | Key advantage | Notes |
|---|---|---|
| **Deepgram** ⭐ | Real-time streaming — transcribes as you speak, no silence-wait delay | Would eliminate the 800ms VAD silence window; SDK available; comparable cost to Whisper |
| **Groq + Whisper** | Same Whisper model, ~5–10× faster inference | Drop-in replacement for `/api/transcribe`; slightly cheaper |
| **AssemblyAI** | Streaming available, good accuracy | Similar approach to Deepgram |

**Recommended next:** Try **Deepgram streaming STT** — it would remove the post-speech silence wait almost entirely since it transcribes word-by-word as the user speaks. The VAD + MediaRecorder approach in `SpeechHandler.js` could be replaced with Deepgram's WebSocket-based streaming client. See https://developers.deepgram.com/docs/getting-started-with-live-streaming-audio

### TTS alternatives to OpenAI gpt-4o-mini-tts

| Provider | Key advantage | Notes |
|---|---|---|
| **ElevenLabs** | Best naturalness/expressiveness available | More expensive; best quality if budget allows |
| **Cartesia** | Very low latency (~100ms to first audio) | Good for real-time feel |
| **OpenAI tts-1** | Cheaper than gpt-4o-mini-tts | Lower quality; use if cost is priority |

---

## Session-start conventions

At the start of each dev session, ask: **"Would you like me to run `npm run audio:check` to verify the static audio cache?"** This audits all voice manifests against the current phrase list and reports missing or stale files. Run `npm run audio:sync` to actually fetch missing files and remove stale ones. The audio files themselves are excluded from git (see `.gitignore`) and must be regenerated locally and uploaded to the server separately.

## Current State

**Branch:** `main` — clean, fully merged.

### Completed work
- Hybrid voice stack (Deepgram Nova-2 STT + OpenAI gpt-4o-mini-tts) — merged from `feature/voice-hybrid`
- Full game logic refactor (`refactor/game-base`) — all shared logic consolidated into BaseGame:
  - All preferences state, localStorage, and `preferencesUpdated` listener live in BaseGame
  - `matchItem` interface replaces `handleVoiceCommand` — BaseGame owns speak→advance loop
  - Start/Stop buttons, settings modal shell, and `isIntroComplete` state all in BaseGame
  - SHAPE_ALIASES added; ShapeGame question variants added; longIntroEnabled reactivity bug fixed
  - Home page name updates immediately on preferences change (no reload needed)
- UX improvements: auto-advance toggle, 30s single-word tip, reveal-then-advance flow

### Remaining items before public launch

- [ ] Test Deepgram Nova-2 accuracy against COLOR_ALIASES and SHAPE_ALIASES — update aliases as needed based on real gameplay
- [ ] Test short single-word answers ("red", "blue", "star") — verify VAD MIN_SPEECH_MS=100ms catches them reliably
- [ ] Cross-browser testing: Chrome desktop, Safari iOS, Android Chrome
- [ ] Rate limiting per-IP (Upstash Redis — see `VOICE_SETUP_INSTRUCTIONS.md`) — recommended before public launch to control API costs
- [ ] CSP in `next.config.mjs`: `connect-src 'self'` is correct as-is — Deepgram is called server-side only, no browser-direct requests
- [ ] Complete Mochahost deployment (see Deployment section below)
- [ ] Run `npm run audio:sync` before first deploy to generate all static TTS audio files

## Deployment

### Current state
Vercel deployment has been removed. **Not yet live in production.** Mochahost migration is in progress — `server.js` has been created (see repo root) for Phusion Passenger, but the app has not yet been deployed. Development runs on localhost only.

### Hosting — Mochahost mochaBusiness (shared hosting)

| Item | Detail |
|---|---|
| **Provider** | Mochahost — Business plan (`mochaBusiness`) |
| **Hosting type** | Shared hosting with cPanel (NOT a VPS) |
| **cPanel user** | `yummywak` |
| **Primary domain** | yummy-wakame.com (`mindsight.training` will be an addon domain) |
| **Home directory** | `/home/yummywak` |
| **Shared IP** | `65.181.116.152` |
| **Server** | s1106 |
| **OS** | Linux x86_64 (CloudLinux, kernel 4.18.0) |
| **Apache** | 2.4.67 |
| **Node.js support** | Via **Phusion Passenger** — managed through cPanel → Software → "Setup Node.js App" |

**Important:** This is shared hosting, not a VPS. Node.js is managed by Phusion Passenger, not PM2 or systemd. You cannot run `npm start` as a persistent process — Passenger handles process lifecycle via the cPanel Node.js App manager.

### Deployment steps (when ready to go live)

1. Add `mindsight.training` as an addon domain in cPanel
2. Set up the Node.js app in cPanel → Software → **Setup Node.js App**
   - Node.js version: select 20.x or 24.x (match local version — currently v24)
   - Application root: path to the app under `/home/yummywak/`
   - Application startup file: `server.js` (already exists in repo root)
3. Run `npm run audio:sync` locally to generate all static TTS audio files, then upload `public/audio/` to the server (audio is gitignored — must be transferred separately)
4. Run `npm run build` locally, then upload the `.next/` build output and all required files
5. Set environment variables (`DEEPGRAM_API_KEY`, `OPENAI_API_KEY`, etc.) in the cPanel Node.js App config — **not** in a `.env.local` file
6. Update `src/app/metadata.js` — set `metadataBase` to `https://mindsight.training`
