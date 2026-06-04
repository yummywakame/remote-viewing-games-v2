# Session Handoff — June 2026

## Active Branch
`feature/static-audio-cache` — do NOT merge to main yet. Testing required first.

---

## What Was Built This Session

### 1. Auto-advance toggle (User Preferences)
- New setting: **"Next item"** toggle in User Preferences modal
- `localStorage` key: `gameAutoAdvance` (`"true"` / `"false"`, default `"true"`)
- **On (default):** game advances automatically after correct guess or reveal — existing behaviour
- **Off:** game stays on current item after correct guess or "what is it?" reveal; user must say "next [gameType]" or click/tap screen to advance
- **First reveal hint (once per session):** when auto-advance is off, the first time an item is revealed (correct guess OR "what is it?"), the game appends: *"Say 'next color' or click the screen to advance when you're ready."* Only spoken once per start→stop session.

### 2. 30-second inactivity tip (once per session)
- If no recognised voice command or interaction occurs for 30 seconds during gameplay, the game speaks: *"Sometimes I can't understand single word answers. Try telling me the [color/shape] in a sentence."*
- Fires **once per start→stop session** only (`tipShownRef` reset at `startGame`)
- Any recognised interaction (guess, navigation, "what is it?", etc.) resets the 30s clock

### 3. "What is it?" now advances when auto-advance is ON
- Previously, asking "what is it?" always stayed on the current item regardless of settings
- Now: auto-advance ON → reveals the item then advances; auto-advance OFF → reveals and waits

### 4. Tightened "what is it?" trigger (then reverted)
- A regex tightening was applied then reverted at user request — the broad `\b(what|which)\b` match is intentional; user confirmed sentences like "I'm not sure what I'm hearing here" are valid triggers

### 5. Static TTS audio cache — `feature/static-audio-cache`
- **`src/lib/gameConstants.js`** — new file, single source of truth for ALL game phrases and item tables. Both game components and audio scripts import from here. Editing a phrase here automatically propagates to the sync script — no separate table to maintain.
- **Game files updated:** `BaseGame.js`, `ColorGame.js`, `ShapeGame.js` all import constants from `gameConstants.js` instead of defining them inline
- **`SpeechHandler.js`** updated: loads `manifest.json` for the current voice on mount/voice-change; `speak()` now checks static file → memory cache → API (in that order)
- **`scripts/phraseList.mjs`** — shared phrase list builder (147 phrases)
- **`scripts/generate-audio.mjs`** — generates MP3s for all 10 voices via OpenAI `gpt-4o-mini-tts`. Resumes gracefully on re-run (skips already-done files). Exits cleanly with a message if OpenAI credits run out.
- **`scripts/check-audio.mjs`** — audits manifests vs current phrase list; reports missing/stale/broken per voice
- **`npm run audio:check`** — audit (no API key needed)
- **`npm run audio:sync`** — generate/update audio (requires `.env.local` with `OPENAI_API_KEY`)
- **MP3 files are gitignored** (`public/audio/**/*.mp3`); manifests (`manifest.json`) ARE committed
- **Estimated cost to generate all 10 voices:** under $1

### 6. `UserPreferences.js` stale closure fix
- `autoAdvance` was missing from `handleSave`'s `useCallback` dependency array — fixed
- This is a recurring pattern: **every preference state var used in `handleSave` must be in its dep array**. Documented in `AGENTS.md` and persistent memory.

### 7. AGENTS.md / deployment updates
- Deployment section updated: Vercel removed, Mochahost migration in progress (not yet live), `server.js` already exists for Phusion Passenger
- Session-start audio:check convention added to AGENTS.md
- `gameAutoAdvance` added to localStorage key table

---

## ⚠️ Action Required Before Merging

### Run audio sync
```bash
npm run audio:sync
```
Expected cost: ~$0.50–$1.50 total for all 10 voices. Ensure you have OpenAI credits. Re-run if it stops mid-way due to credits — it will resume from where it left off.

### Test checklist

**Auto-advance toggle:**
- [ ] Toggle defaults to ON; existing game flow unchanged
- [ ] Toggle OFF: correct guess → speaks response + hint → stays on item
- [ ] Toggle OFF: "what is it?" → reveals + hint → stays on item
- [ ] Toggle OFF: hint only fires once per session (not on subsequent reveals)
- [ ] Toggle OFF: "next color/shape" or screen tap advances correctly
- [ ] Toggle ON: "what is it?" reveals AND advances to next item
- [ ] Preference persists when set before starting game (stale closure fix)
- [ ] Preference persists across page exit and return

**30-second tip:**
- [ ] Tip fires after ~30s of silence during gameplay
- [ ] Tip only fires once per session
- [ ] Any voice command resets the 30s clock

**Static audio cache:**
- [ ] After running `audio:sync`, browser console shows `[TTS] static:` for pre-generated phrases
- [ ] Name-bearing intro/outro still works via API (`[TTS] api:`)
- [ ] Voice change in settings loads new manifest and serves correct voice's static files
- [ ] Graceful fallback: if static file fetch fails, falls back to API silently
- [ ] `npm run audio:check` reports all phrases present after sync

**Phrase source of truth:**
- [ ] Edit a phrase in `gameConstants.js`, run `audio:check` — it reports that phrase as stale/missing

---

## Architecture Notes for Next Agent

- **Adding a new game phrase:** edit `src/lib/gameConstants.js` only. The generation script picks it up automatically on next `audio:sync`. Run `audio:check` to verify.
- **Adding a new game (e.g. Number Game):** add its item table and question variants to `gameConstants.js`, add a new entry to the `GAMES` array, then run `audio:sync`.
- **Name-stitching (future feature):** pre-generate sentence template parts around `[name]`, stitch with Web Audio API at runtime. Gracefully falls back to no-name version if name fetch fails. NOT YET BUILT — agreed to add after this branch is tested and merged.
- **`speak()` priority:** static file → in-memory cache → API. Static files are loaded into memory cache on first use, so subsequent plays within a session are instant.
