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
│   │   ├── api/
│   │   │   ├── speak/        # POST: OpenAI TTS → audio/mpeg
│   │   │   └── transcribe/   # POST: audio blob → Whisper transcript
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
| `userPreferencesName` | User's name (used in voice intro and outro) |
| `userPreferencesVoiceSpeed` | TTS playback speed (default 1.2) |
| `userPreferencesVoiceName` | Selected OpenAI voice name (default `echo`) |
| `gameLongIntro` | `"true"` / `"false"` — full vs brief welcome message |
| `colorGameSelectedItems` | JSON array of active colors |

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

All voice logic lives in two files:
- `src/app/components/SpeechHandler.js` — `useSpeech` hook. Handles mic permission, VAD (voice activity detection), MediaRecorder clip capture, OpenAI TTS playback, and in-memory TTS cache. Returns `{ speak, startListening, stopListening, cancelSpeech, isListening, isSpeaking }`.
- `src/app/api/transcribe/route.js` — server-side POST route; receives audio blob, calls OpenAI Whisper (`whisper-1`), returns `{ transcript }`.
- `src/app/api/speak/route.js` — server-side POST route; receives `{ text, voice, speed }`, calls OpenAI TTS (`gpt-4o-mini-tts`), returns `audio/mpeg`.

**STT:** OpenAI Whisper via VAD-driven MediaRecorder. AudioContext + AnalyserNode detects speech onset; 800ms of silence after speech triggers the clip send.
**TTS:** OpenAI `gpt-4o-mini-tts`. Default voice: `echo`. Speed default: 1.2. Available voices: `alloy`, `ash`, `ballad`, `coral`, `echo`, `fable`, `nova`, `onyx`, `sage`, `shimmer`. Speed range 0.25–4.0. Tone: jovial, upbeat, playful — emphasises ALL CAPS words.
**TTS cache:** `speak()` caches audio `Blob` objects in memory keyed by text. Repeated phrases (question variants, try-again, outro) cost 0 API calls after the first play. Cache is cleared when voice or speed changes.
**Security:** `OPENAI_API_KEY` in `.env.local`, used only server-side — never in client code or `NEXT_PUBLIC_` vars.

### VAD tuning constants (`SpeechHandler.js`)

| Constant | Value | Purpose |
|---|---|---|
| `SPEECH_THRESHOLD` | 15 RMS | Lower threshold catches plosive-onset words ("pink") |
| `MIN_SPEECH_MS` | 100ms | Time since first onset before confirming as speech |
| `SILENCE_DURATION_MS` | 800ms | Silence after speech → send clip to Whisper |
| `VAD_INTERVAL_MS` | 100ms | How often VAD polls the analyser |
| `MAX_CLIP_MS` | 10000ms | Force-rotate recording after this long |
| `IDLE_TIMEOUT_MS` | 5 min | Stop listening after no confirmed speech |

**Key VAD behaviour:** The burst timer (`speechStartTimeRef`) is only reset after 150ms of sustained silence — brief dips during short crisp words do not interrupt accumulation. Speech confirmation is checked outside the threshold block so elapsed time counts through dips.

### Hallucination filter

Whisper hallucinates common phrases on silence/ambient noise. The filter discards a transcript if **every sentence** (split on `.!?`) is a known hallucination phrase (e.g. "thank you. thank you." is caught). Known phrases: bye, goodbye, thank you, thanks, see you, you're welcome, thank you for watching.

### `handleVoiceCommand` interface

BaseGame handles common commands centrally (stop/next/skip/help) and calls:
```js
const matchedWord = handleVoiceCommand(transcript, speak)
if (matchedWord) setLastInteraction(Date.now())  // resets inactivity timer
```
Game components return the matched word (string) on recognition, `undefined` otherwise. The inactivity timer only resets on recognised game items or navigation commands — background noise transcripts do not keep the game alive.

## Game Response Variations

All response arrays live at module level in `ColorGame.js` / `BaseGame.js`.

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

### ColorGame — correct responses (cycle in order)
1. `Correct! It IS [color]!`
2. `Yes, it's [color]!`
3. `Well done! [Color]!`
4. `Yes, [color]!`
5. `You nailed it! It's [color]!`
6. `Yep, it's [color]!`
7. `It IS [color]!`
8. `[Color] it is!`

### ColorGame — try-again responses (random)
Not this time — keep sensing! / Almost! Give it another go. / Keep going, you've got this! / Not quite — what else do you pick up? / Give it another try! / You're getting there — try again!

### Question variants (random after first; first is always fixed)
What color is this? / What color do you see? / Can you tell what color this is? / What about this one? / And this one? / How about this one? / What do you sense?

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

## Active Work in Progress

### Next up: Deepgram STT migration

- [ ] Investigate Deepgram streaming STT as replacement for Whisper VAD approach in `SpeechHandler.js`
  - Deepgram WebSocket streams transcript in real-time — no silence-wait, faster response
  - Would remove most of the VAD complexity (no MediaRecorder clips, no burst timer)
  - Keep `/api/speak` (OpenAI TTS) unchanged
  - See https://developers.deepgram.com/docs/getting-started-with-live-streaming-audio

### Remaining items

- [ ] "pink" still unreliable — add more COLOR_ALIASES as discovered during testing (Whisper mishearings)
- [ ] Cross-browser testing: Chrome desktop, Safari iOS, Android Chrome
- [ ] Rate limiting per-IP (Upstash Redis — see `VOICE_SETUP_INSTRUCTIONS.md`) — recommended before public launch to control API costs

## Deployment

Currently on Vercel. When the `mindsight.training` domain is connected, update:
- The Vercel project's custom domain setting
- `src/app/metadata.js` — update `metadataBase` URL and any hardcoded domain references
