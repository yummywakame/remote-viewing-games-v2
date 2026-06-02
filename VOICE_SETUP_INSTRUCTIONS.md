# Voice Integration Setup Instructions

## Current Status

The existing voice implementation uses the browser's built-in **Web Speech API** for both STT and TTS. The TTS (`window.speechSynthesis`) works adequately across browsers. The STT (`webkitSpeechRecognition`) is broken — it returns a `"network"` error because it phones home to Google's servers and is unreliable cross-browser, particularly on iOS Safari and Android.

**Decision:** Replace STT with OpenAI Whisper. Keep TTS as-is (browser `speechSynthesis`) for now, or optionally upgrade to OpenAI TTS (`gpt-4o-mini-tts`) since the account is already set up.

**Branch:** `feature/voice-openai-whisper`

---

## Speech-to-Text: OpenAI Whisper

### Why OpenAI Whisper
- Accurate for simple vocabulary (colors, shapes, numbers, objects, words)
- Pre-recorded/batch API — send a captured audio clip, get back a transcript (~300ms)
- No streaming required for this use case, which keeps costs low
- Single account/bill for both STT and TTS if OpenAI TTS is also adopted
- **API key must never touch the browser** — protected via a Next.js API route (see Security below)

### Pricing
| Model | Cost | Notes |
|---|---|---|
| `whisper-1` / `gpt-4o-mini-transcribe` | $0.003/min of audio | Sufficient for simple vocab |
| `gpt-4o-transcribe` | $0.006/min of audio | Higher accuracy, not needed here |

Estimated cost: ~$0.04 per 30-minute session (200 × 4-second clips ≈ 13 mins audio).

**Important:** OpenAI's spending "limit" is notification-only — it does NOT cut off API access when reached. The real protection is the server-side API route (see Security below).

### Account Setup
1. Account already exists at **platform.openai.com**
2. Go to **Billing** → add credits ("Add credits" prompt visible in dashboard)
3. Go to **Settings → Limits** — set a notification threshold so you get an email if spend spikes
4. Go to **API Keys** → create a new key scoped to this project
5. Add the key to `.env.local` as `OPENAI_API_KEY=sk-...` (never commit this file)

### Security — Next.js API Route
The OpenAI key must live server-side only. Implementation plan:
- Create `src/app/api/transcribe/route.js` — accepts audio blob from the game, calls OpenAI, returns transcript
- Add rate limiting per IP (e.g. `upstash/ratelimit` or a simple in-memory counter)
- Cap maximum audio clip length (reject anything over 10 seconds)
- Never expose `OPENAI_API_KEY` in client-side code or `NEXT_PUBLIC_` env vars

### Word Matching
Because Whisper returns the full transcript as plain text, detecting the answer is a simple substring search. This naturally handles:
- Just the word: `"yellow"` → found
- Hesitation: `"hmm... is it yellow?"` → found
- Confirmation: `"I think it might be yellow"` → found

Implementation: `transcript.toLowerCase().includes(targetWord.toLowerCase())`

No special intent engine or exact-match logic needed.

### Files to Modify
The voice logic is split across two files — both need updating:
- `src/app/components/SpeechHandler.js` — main STT/TTS component (replace `webkitSpeechRecognition` with fetch to API route)
- `src/app/components/BaseGame.js` — also initialises its own speech recognition singleton (lines ~480–585); this duplicate logic should be consolidated into `SpeechHandler.js`

---

## Text-to-Speech: Browser Web Speech API (current)

`window.speechSynthesis` is used for TTS and works acceptably on Chrome, Firefox, and Android. Known iOS Safari issue: audio must be triggered by a direct user gesture — this can cause the first utterance to fail if not properly initialised.

### Optional Upgrade: OpenAI TTS
Since the OpenAI account is already set up, upgrading TTS to `gpt-4o-mini-tts` is straightforward:
- Voice options include "Coral" (friendly, natural)
- Would require a second API route: `src/app/api/speak/route.js`
- Audio returned as a stream; play via Web Audio API or `<audio>` element
- Pricing: separate TTS pricing applies (check platform.openai.com/pricing)

Decide at implementation time whether to upgrade TTS or keep the free browser version.

---

## Implementation Checklist

- [x] Add billing credits to OpenAI account
- [x] Create OpenAI API key, add to `.env.local`
- [x] Create `src/app/api/transcribe/route.js` (1 MB size cap, 200-byte minimum)
- [x] Create `src/app/api/speak/route.js` (OpenAI TTS, `gpt-4o-mini-tts`, voice + speed validated)
- [x] Rewrite `SpeechHandler.js` as `useSpeech` hook — VAD via AudioContext + AnalyserNode, MediaRecorder for capture, fetch to `/api/transcribe`
- [x] Remove duplicate speech singleton from `BaseGame.js`; wire `useSpeech` hook in its place
- [x] Silence detection (VAD) implemented — 1.5 s silence after speech triggers clip send
- [x] Word-matching via Whisper full transcript (substring search handled by game handlers)
- [x] Upgrade TTS to OpenAI `gpt-4o-mini-tts` (coral default; all OpenAI voices available)
- [x] `UserPreferences.js` — browser voice list replaced with OpenAI voice picker; preview uses `/api/speak`
- [x] Common voice commands (stop/next/help/thanks) centralised in `BaseGame.js`
- [x] `handleVoiceCommand(command, speak)` interface unified across `ColorGame` and `ShapeGame`
- [x] VAD hallucination filter — known Whisper false-positives discarded (bye, thank you, etc.)
- [x] Minimum speech duration (250ms) to ignore brief noise spikes
- [x] 5-minute VAD idle timeout — stops listening if no speech sent; resumes on tap/click
- [x] 2-minute game inactivity timeout — ends game if no voice or tap in 2 minutes
- [x] Voice tone instructions — warm, curious, encouraging coach style
- [x] Content-Security-Policy — `media-src blob:` added to allow audio playback
- [x] `distDir` moved outside OneDrive (`AppData\Local\Temp\nextjs-mindsight\.next`) to prevent symlink corruption
- [ ] **BUG: `Cannot find module 'react/jsx-runtime'`** at runtime — distDir outside project root breaks Node module resolution for compiled pages. Needs investigation (revert distDir approach OR find alternative OneDrive exclusion).
- [ ] Test on Chrome desktop, Safari iOS, Android Chrome
- [ ] Add rate limiting per-IP (requires Upstash Redis or similar on Vercel)
