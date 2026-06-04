# MindSight Training — Project Documentation for AI Agents

## What This App Is

**mindsight.training** is a solo practice web app for developing MindSight — the ability to perceive visual information while blindfolded (extra-ocular vision). Users practice independently through interactive games that train color, shape, and number perception without using their eyes.

This is a companion app to the coaching site at **mindsight.coach**. Where mindsight.coach is for booking 1-on-1 sessions with Olivia Meiring, this app is for ongoing solo practice between sessions (and for self-guided learners).

## Repository

- **GitHub:** https://github.com/yummywakame/mindsight-training-webapp
  (Previously named `remote-viewing-games-v2`)
- **Production domain:** https://mindsight.training (not yet live)
- **Current deployment:** localhost only — Vercel removed, Mochahost migration in progress
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
| Deployment | Mochahost mochaBusiness via Phusion Passenger (migration in progress — not yet live) |
| STT | Deepgram Nova-2 (batch REST via `/api/transcribe`) |
| TTS | OpenAI `gpt-4o-mini-tts` (via `/api/speak`) |

## Directory Structure

```
www/                          # Repo root
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── speak/        # POST: OpenAI gpt-4o-mini-tts → audio/mpeg (fallback for dynamic phrases)
│   │   │   └── transcribe/   # POST: audio blob → Deepgram Nova-2 transcript
│   │   ├── color-game/       # Color perception training game
│   │   ├── shape-game/       # Shape perception training game
│   │   ├── number-game/      # Number perception training game (digits 0–9)
│   │   ├── components/       # App-level shared components
│   │   ├── fonts/            # Custom font files
│   │   ├── globals.css       # Global stylesheet
│   │   ├── layout.js         # Root layout — h-screen overflow-hidden body/main; no width wrapper (game pages use fixed positioning)
│   │   ├── metadata.js       # Site metadata config
│   │   └── page.js           # Home / landing page (responsive, scrollable on small screens)
│   ├── components/
│   │   ├── BaseGame.js           # Shared game shell — owns all prefs state, voice flow, buttons, settings modal. Stop button is fixed bottom-8.
│   │   ├── CosmicBackground.js   # Shared background: pulsing nebula glows + twinkling starfield
│   │   ├── ColorGame.js          # Color game — provides matchItem, COLOR_ALIASES; imports itemTable/variants from gameConstants
│   │   ├── ShapeGame.js          # Shape game — provides matchItem, SHAPE_ALIASES; imports itemTable/variants from gameConstants
│   │   ├── NumberGame.js         # Number game — spoken-word + alias matching; NUMBER_DISPLAY_WORDS + NUMBER_ARTICLES for TTS
│   │   ├── GameDisplay.js        # Full-screen display: color bg fade, shape SVG, number SVG crossfade via AnimatePresence.
│   │   │                         # Responsive sizing: ITEM_SIZE = min(85vw, calc(100vh - 160px), 900px)
│   │   ├── GameSettings.js       # Shared settings modal shell — gridCols prop (default 2), extraItems prop (renders below main grid full-width)
│   │   ├── ColorGameSettings.js  # Thin wrapper: passes renderItem (color swatch) to GameSettings
│   │   ├── ShapeGameSettings.js  # Adds Dark/Light background toggle (indigo Switch); passes renderItem (shape SVG) to GameSettings
│   │   ├── NumberGameSettings.js # Calculator keypad layout (3-col 1–9, 0 full-width below via extraItems); Dark/Light toggle
│   │   └── ui/                   # Radix UI-based primitive components
│   ├── lib/
│   │   └── gameConstants.js  # Single source of truth for ALL phrases, item tables, phrase builders
│   └── utils/                # Utility/helper functions (sanitizeInput, getArticle, selectNewItem, etc.)
├── scripts/
│   ├── phraseList.mjs        # Shared phrase list builder (derives 249 phrases from gameConstants)
│   ├── generate-audio.mjs    # Generates static MP3s for all voices — run with audio:sync
│   ├── check-audio.mjs       # Audits manifests vs phrase list — run with audio:check
│   └── delete-phrase.mjs     # Finds and deletes a phrase's MP3(s) by text search so generate-audio re-fetches it; supports --voice <name|all>, fuzzy/case-insensitive matching, and suggests close matches on no-match
├── public/
│   └── audio/                # Per-voice static TTS files (gitignored MP3s + committed manifests)
│       └── {voice}/manifest.json
├── server.js                 # Phusion Passenger entry point (required for Mochahost)
├── source/                   # Source/reference assets
├── .github/
│   └── workflows/            # GitHub Actions CI (Dependabot auto-merge etc.)
├── next.config.mjs           # Next.js configuration
├── tailwind.config.js        # Tailwind configuration
├── postcss.config.mjs        # PostCSS config (locked to v8.5.10 for compat)
├── components.json           # shadcn/ui component config
├── jsconfig.json             # JS path aliases
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
| `userPreferencesVoiceSpeed` | TTS playback speed (default 1.1) |
| `userPreferencesVoiceName` | Selected OpenAI voice name (default `echo`) |
| `gameLongIntro` | `"true"` / `"false"` — full vs brief welcome message |
| `gameAutoAdvance` | `"true"` / `"false"` — auto-advance to next item after correct guess (default `"true"`) |
| `colorGameSelectedItems` | JSON array of active colors |
| `shapeGameSelectedItems` | JSON array of active shapes |
| `shapeGameLightMode` | `"true"` / `"false"` — light background (white bg, black shape) vs dark (default) |
| `numberGameSelectedItems` | JSON array of active digits (e.g. `["0","1","2",...]`) |
| `numberGameLightMode` | `"true"` / `"false"` — light background (white bg, black number) vs dark (default) |

| Game | Route | Status |
|---|---|---|
| Color Game | `/color-game` | Live |
| Shape Game | `/shape-game` | Live |
| Number Game | `/number-game` | Live |
| Object Game | `/object-game` | Planned |
| Word Game | `/word-game` | Planned |
| Scene Game | `/scene-game` | Planned |

Each game is designed to be used with a physical blindfold or sleep mask. The user puts on the blindfold, then attempts to perceive what is shown on screen through MindSight. The app provides feedback and progression.

## Development

```bash
npm run dev          # Start dev server (port 3000 or next available)
npm run build        # Production build
npm run start        # Run production server
npm run lint         # Lint
npm run audio:check  # Audit static TTS cache — no API key needed
npm run audio:sync   # Generate/update static TTS audio files (requires .env.local)
```

**Collaboration conventions:**
- **Flag before acting:** Always flag potential issues, trade-offs, or ambiguities to the user *before* making a change — don't just go ahead. This applies to things like: a proposed alias that could cause false positives, a formatting inconsistency in new copy, a decision that affects audio regeneration costs, etc.

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
**TTS:** OpenAI `gpt-4o-mini-tts`. Default voice: `echo`. Speed default: 1.1. Available voices: `alloy`, `ash`, `ballad`, `coral`, `echo`, `fable`, `nova`, `onyx`, `sage`, `shimmer`. Speed range 0.25–4.0. Tone: jovial, upbeat, playful — emphasises ALL CAPS words.
**TTS cache:** `speak()` resolves audio in three steps: (1) check in-memory client cache (`audioCacheRef`), (2) check static pre-generated file via the voice's `manifest.json` in `public/audio/{voice}/`, (3) fall back to the `/api/speak` API. Static files cover all known game phrases (249 per voice, pre-generated with `audio:sync`). Only dynamic phrases (name-bearing intro/outro) hit the API. Client cache is cleared when voice or speed changes. The `/api/speak` route also has a server-side in-memory cache (keyed by `voice:text`) so repeated API calls within a server session never hit OpenAI twice. The response includes an `X-Cache: HIT|MISS` header which the client logs as `[TTS] server-cached:` or `[TTS] api:`.
**Security:** `OPENAI_API_KEY` and `DEEPGRAM_API_KEY` in `.env.local`, used only server-side — never in client code or `NEXT_PUBLIC_` vars.
**Expected latency:** ~800ms VAD silence wait + ~300ms Deepgram transcription = ~1.1s total (down from ~2.3s with Whisper).

### VAD tuning constants (`SpeechHandler.js`)

| Constant | Value | Purpose |
|---|---|---|
| `SPEECH_THRESHOLD` | 15 RMS | Lower threshold catches plosive-onset words ("pink") |
| `MIN_SPEECH_MS` | 100ms | Time since first onset before confirming as speech |
| `SILENCE_DURATION_MS` | 200ms | Silence after speech → send clip to Deepgram |
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
- `isCorrect === null` → special command (show me / reveal). If result includes `revealText`, BaseGame speaks it (and advances if auto-advance is on, or appends the advance hint once if off). BaseGame resets the inactivity timer.
- `null` → nothing matched; inactivity timer is NOT reset.

Game components pass `displayItem` for grammatical phrasing — e.g. ShapeGame returns `displayItem: "a circle"`, NumberGame returns `displayItem: "a nine"` or `displayItem: "an eight"`, so correct responses say "It IS a nine!" not "It IS 9!".

**TTS digit safety:** Never pass raw digit characters (e.g. `"9"`) to TTS — punctuation adjacent to digits causes misreadings (`"9!"` → "nine point nine", `"0!"` → "zero exclamation"). Always use `NUMBER_DISPLAY_WORDS` for spoken output.

The inactivity timer only resets on recognised game items or navigation commands — background noise transcripts do not keep the game alive.

## Game Response Variations

All phrase constants (`CORRECT_RESPONSES`, `TRY_AGAIN_RESPONSES`, `OUTRO_RESPONSES`, item tables, question variants, and phrase builder functions) live in **`src/lib/gameConstants.js`** — the single source of truth. Game components import from there. `COLOR_ALIASES`, `SHAPE_ALIASES`, and `NUMBER_ALIASES` remain in their respective game files (STT-matching only, not used for audio generation).

### Correct responses — `gameConstants.js` (cycle in order, shared by all games)
Functions take `(item, display?)` — `display` is used when an article is needed (e.g. "a circle", "an eight").
1. `Correct! It IS [display]!`
2. `Yes, it's [display]!`
3. `Well done! [Display]!`
4. `Yes, [display]!`
5. `You nailed it! It's [display]!`
6. `Yep, it's [display]!`
7. `It IS [display]!`
8. `[Display] it is!`

### Try-again responses — `gameConstants.js` (random, shared by all games)
Not this time — keep sensing! / Almost! Give it another go. / Not quite! Keep going, you've got this! / Not quite — what else do you pick up? / Give it another try! / You're getting there — try again!

### Question variants (random after first; first is always fixed)
**ColorGame:** What color is this? / Next. What color do you see? / Next. Can you tell what color this is? / Next. What about this one? / Next. And this one? / Next. How about this one? / Next. What do you sense?
**ShapeGame:** same set with "shape" in place of "color".
**NumberGame:** What number is this? / Next. What number do you see? / Next. Can you tell what number this is? / Next. What about this one? / Next. And this one? / Next. How about this one? / Next. What's this number?
The first question on game start uses `getFirstQuestion(gameType)` from `gameConstants.js`. Subsequent questions use the variants array randomly.

### ColorGame — `COLOR_ALIASES`
Deepgram sometimes mishears short color words. Aliases use word-boundary regex matching:

| Color | Aliases |
|---|---|
| red | raid, reed, read, rad, bread, rick, great |
| yellow | gielo, jello |
| purple | pebble, pebbles |
| orange | french |
| blue | okay, play |

Both active and inactive colors are checked — saying any color name (even a deselected one) triggers a "try again" response.

### ShapeGame — `SHAPE_ALIASES`
Initial phonetic guesses — refine during real play as needed:

| Shape | Aliases |
|---|---|
| triangle | try angle, trying, try angel, tri angle |
| square | scare, squire, swear, squared |
| circle | surgical, surreal, circles, circled |
| oval | over, opal, able, oh well, hello |
| diamond | die man, diamonds, diemond |
| star | store, scar, stare, start, stars |

### NumberGame — matching & display

**`NUMBER_DISPLAY_WORDS`** (in `gameConstants.js`) maps digit keys to spoken words: `'0'→'zero'`, `'1'→'one'`, … `'9'→'nine'`. Always use these for TTS output, never raw digit characters.

**`NUMBER_ARTICLES`** (in `gameConstants.js`) maps digit keys to correct articles. Only `'8'→'an'` (an eight); all others use `'a'`. Note: "one" is pronounced "wun" so takes "a" not "an".

**`NUMBER_WORD_MAP`** (in `NumberGame.js`) maps spoken words to digit keys for STT matching: `zero→'0'`, `one→'1'`, … `nine→'9'`. Checked first in `matchNumberInCommand`.

**`NUMBER_ALIASES`** (in `NumberGame.js`) — Deepgram mishearing aliases, tuned during real play:

| Digit | Aliases |
|---|---|
| 0 | oh, nought, naught |
| 1 | won, wan |
| 2 | too, tu |
| 3 | tree, free |
| 4 | for, fore, fur |
| 5 | hive, fife |
| 6 | sex |
| 7 | heaven |
| 8 | ate, ait |
| 9 | nein, note |

Note: `note` is confirmed Deepgram mishearing of "nine" and is intentionally NOT added to 0 (naught) to avoid conflict.

Both active and inactive digits are checked — saying any digit word triggers a response.

### Outro responses (`gameConstants.js` — cycles with name)
- `Thanks [name]! Let's practice again soon.` / `Thank you for playing!`
- `Thanks [name]! I hope we play again soon.` / `Great session — thanks for playing!`
- `That was a good practice session, [name]!` / `That was a great practice session!`

**Timeout:** always says `"Goodbye!"`

### Timers
- **2-min game inactivity** → ends game with timeout message (only resets on recognised items/commands, not background noise)
- **30-sec no-recognition tip** → speaks single-word-answer tip once per session if no recognised interaction
- **5-min VAD idle** → stops listening (restarts on next interaction)

## Game Display

**Responsive sizing:** `GameDisplay.js` uses `ITEM_SIZE = 'min(85vw, calc(100vh - 160px), 900px)'` for both shapes and numbers. This prevents overflow on any screen size — constrained by width, available height (accounting for 64px header + 80px stop button), and a 900px max cap on large screens.

**Shapes:** Rendered via Next.js `<Image>` with CSS size override using `ITEM_SIZE`.

**Numbers:** Rendered as inline SVG (`viewBox="0 0 200 200"`, `textAnchor="middle"`, `dominantBaseline="central"`) for consistent cross-browser scaling. The digit is centered at `x=100 y=100` with `fontSize=175`.

**Stop button:** `fixed bottom-8` — sits at the bottom edge during gameplay, maximising display area.

## Home Page Layout

- `body` has `h-screen overflow-hidden` (needed for game pages which are all fixed-positioned)
- `layout.js` `main` has `h-screen pt-16` — children render directly (no width wrapper)
- Home page outer div is `h-full overflow-y-auto` — makes it the scroll container within the fixed shell
- **Responsive grid:** `grid-cols-1 min-[480px]:grid-cols-3` — 3 columns from 480px
- **Responsive padding:** `px-4 sm:px-6 md:px-10` on outer, `p-4 sm:p-5 md:p-6` on cards
- **Text scales down below 480px:** heading `text-3xl`, tagline `text-base`, footer note `text-sm`
- **Scroll fix:** `items-start` below 480px prevents flex-center from clipping overflowed content above scroll origin; `items-center` at 480px+ for visual centering when content fits

## Alternative Voice Providers (for future consideration)

### STT — currently using Deepgram Nova-2
Deepgram batch REST is the active STT provider. Future upgrade option:
- **Deepgram streaming** — would eliminate the 800ms VAD silence window entirely (transcribes word-by-word). See https://developers.deepgram.com/docs/getting-started-with-live-streaming-audio

Other alternatives evaluated:
| Provider | Key advantage | Notes |
|---|---|---|
| **Groq + Whisper** | ~5–10× faster Whisper inference | Drop-in for `/api/transcribe`; slightly cheaper |
| **AssemblyAI** | Streaming available | Similar approach to Deepgram |

### TTS — currently using OpenAI gpt-4o-mini-tts
Static pre-generation via `audio:sync` eliminates most API calls during gameplay. Future alternatives:
| Provider | Key advantage | Notes |
|---|---|---|
| **ElevenLabs** | Best naturalness/expressiveness | More expensive; best quality if budget allows |
| **Cartesia** | ~100ms to first audio | Good for real-time dynamic phrases |
| **OpenAI tts-1** | Cheaper | Lower quality |

---

## Session-start conventions

At the start of every new agent session:
1. **Run the dev server** (`npm run dev`) in the background and **open the app** in the user's browser at `http://localhost:3000`. Keep it running throughout the session — Next.js hot-reloads on every save so the user sees changes instantly without manual refresh.
2. **Ask:** "Would you like me to run `npm run audio:check` to verify the static audio cache?" This audits all voice manifests against the current phrase list and reports missing or stale files. Run `npm run audio:sync` to actually fetch missing files and remove stale ones. The audio files themselves are excluded from git (see `.gitignore`) and must be regenerated locally and uploaded to the server separately.

## Current State

**Active branch:** `main`

### Completed work
- Hybrid voice stack (Deepgram Nova-2 STT + OpenAI gpt-4o-mini-tts)
- Full game logic refactor — all shared logic in BaseGame (`matchItem` interface, speak→advance loop, prefs state)
- Static TTS audio cache: 249 phrases × 10 voices pre-generated; manifest-based lookup; API fallback for dynamic (name-bearing) phrases only
- Server-side TTS in-memory cache in `/api/speak`; `X-Cache` response header for client-side logging
- STT/TTS error handling: 8s timeout, 2-strike failure detection, pre-generated error message, graceful game-end on connectivity loss
- TTS fallback: name-bearing intro/outro falls back to no-name static version if API unreachable
- Speed: `audio.playbackRate` for all playback; default `echo` voice, speed `1.1`
- VAD tuning: SILENCE_DURATION_MS at 200ms for snappy response
- STT aliases tuned through real gameplay (COLOR_ALIASES, SHAPE_ALIASES, NUMBER_ALIASES)
- **Number Game** (`/number-game`): digits 0–9, spoken-word + alias STT matching, calculator keypad settings (3-col 1–9, wide 0 below), dark/light toggle, green→orange gradient, full audio cache generated
- **Number game TTS safety**: displayItem uses NUMBER_DISPLAY_WORDS + NUMBER_ARTICLES ("a nine", "an eight") — never raw digit chars next to punctuation
- **Responsive game display**: `ITEM_SIZE = min(85vw, calc(100vh - 160px), 900px)` for shapes and numbers; numbers rendered as inline SVG
- **Stop button repositioned**: `fixed bottom-8` — maximises screen space for display during gameplay
- **Responsive home page**: 3-column grid from 480px, scrollable on small screens, text scales down below 480px
- **Cosmic background**: `CosmicBackground` component — 5 pulsing nebula glow orbs + 160-star twinkling field
- **Shape/Number game Dark/Light toggle**: saves on Save; Reset reverts to dark; indigo Switch styling consistent across all settings
- **Smooth fade transitions**: color bg 700ms CSS; shape/number crossfade 400ms Framer Motion AnimatePresence
- **UI color scheme**: deep indigo/violet palette — modals `#12122e`, indigo switches/buttons, `border-white/10` dividers
- **Voice dropdown**: `bg-[#12122e]` with `[&>option]:bg-[#12122e]` to carry dark theme into native browser dropdown

### Remaining items before public launch

- [ ] Cross-browser testing: Chrome desktop, Safari iOS, Android Chrome
- [ ] Rate limiting per-IP (Upstash Redis — see `VOICE_SETUP_INSTRUCTIONS.md`) — recommended before public launch to control API costs
- [ ] Complete Mochahost deployment (see Deployment section below)
- [ ] Upload `public/audio/` to server after deploy (gitignored — must transfer separately; run `npm run audio:sync` first to ensure cache is current)

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
3. Run `npm run audio:sync` locally to ensure all static TTS audio files are current, then upload `public/audio/` to the server (audio is gitignored — must be transferred separately)
4. Run `npm run build` locally, then upload the `.next/` build output and all required files
5. Set environment variables (`DEEPGRAM_API_KEY`, `OPENAI_API_KEY`, etc.) in the cPanel Node.js App config — **not** in a `.env.local` file
6. Update `src/app/metadata.js` — set `metadataBase` to `https://mindsight.training`
