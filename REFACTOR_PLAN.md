# MindSight Training — Refactor Plan: `refactor/game-base`

**Created:** 2026-06-03  
**Status:** IN PROGRESS — Group 1 done, Group 2 in progress  
**Goal:** Move shared game logic from ColorGame/ShapeGame into BaseGame. Zero visible change to the user — same sounds, same look, same behaviour.

---

## Handover Context for New Agent

This document is the working plan for a structural refactor. Read it alongside `AGENTS.md` which has full project architecture, tech stack, voice stack, and deployment info.

### Quick-start commands
```powershell
# Working directory
cd "C:\Users\olivi\OneDrive\www\MindSight Projects\mindsight-training\www"

# Build
npm run build

# Run production server (Phusion Passenger entry point)
node server.js

# Kill server on port 3000
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000 -State Listen).OwningProcess -Force

# Dev server (faster for refactor iteration)
npm run dev
```

### Git state at handover
- **Current branch:** `main` — clean, fully merged, this is the checkpoint
- **Create refactor branch from main:**
  ```bash
  git checkout -b refactor/game-base
  git config --local user.name "yummywakame"
  git config --local user.email "5927823+yummywakame@users.noreply.github.com"
  ```
- **Other branches:** `feature/voice-hybrid` and `feature/voice-openai-whisper` are preserved but superseded

### OneDrive / .next junction point
The project lives in OneDrive which corrupts Next.js build artifacts. `.next` is a Windows junction to `C:\Users\olivi\AppData\Local\Temp\nextjs-mindsight\.next`. If build artifacts look corrupt, rebuild with `npm run build`. Do NOT delete `.next` directly — it is a junction.

### Key files for this refactor
```
src/app/components/
  BaseGame.js          ← receives most of the new logic
  ColorGame.js         ← loses duplicated logic, keeps color-specific code
  ShapeGame.js         ← loses duplicated logic, keeps shape-specific code
  ColorGameSettings.js ← will be replaced by shared GameSettings
  ShapeGameSettings.js ← will be replaced by shared GameSettings
  GameSettings.js      ← NEW — shared modal shell
  GameDisplay.js       ← minor: remove one console.log (see item 11)
  UserPreferences.js   ← no changes needed
  SpeechHandler.js     ← no changes needed
src/utils/gameUtils.js ← remove dead code, keep debug logs
src/app/layout.js      ← no changes needed
src/app/page.js        ← Group 7: add preferencesUpdated listener
```

### Debug console.logs to KEEP (user preference)
The following console.logs are intentional and must not be removed:
- `gameUtils.js` — `console.log('Selecting initial item from:', selectedItems)`
- `gameUtils.js` — `console.log('Selected item:', newItem)`
- `GameDisplay.js` — `console.log('[GameDisplay] Color updated: ...')`

---

## Refactor Items — Master Table

| # | Group | Item | File(s) | Coded | Built | Tested | Notes |
|---|-------|------|---------|:-----:|:-----:|:------:|-------|
| 1 | Cleanup | Remove dead `handleCommonVoiceCommands` function | `gameUtils.js` | [x] | [x] | [x] | Never called anywhere — BaseGame handles this directly |
| 2 | Cleanup | Remove dead `backgroundMode` prop | `BaseGame.js`, `ColorGame.js`, `ShapeGame.js` | [x] | [x] | [x] | Passed by both games, never used in BaseGame |
| 3 | Cleanup | Remove dead `longIntroEnabled` prop ShapeGame→BaseGame | `ShapeGame.js` | [x] | [x] | [x] | BaseGame ignores it; causes confusion |
| 4 | Cleanup | Consolidate duplicate `selectNewItem` | `ColorGame.js`, `gameUtils.js` | [x] | [x] | [x] | ColorGame has its own copy; use `gameUtils` version only |
| 5 | Preferences | Move `userName`, `voiceSpeed`, `voiceName` state to BaseGame | `BaseGame.js`, `ColorGame.js`, `ShapeGame.js` | [x] | [x] | [x] | Identical in both games |
| 6 | Preferences | Move localStorage read on mount to BaseGame | `BaseGame.js`, `ColorGame.js`, `ShapeGame.js` | [x] | [x] | [x] | Identical in both games |
| 7 | Preferences | Move `preferencesUpdated` event listener to BaseGame | `BaseGame.js`, `ColorGame.js`, `ShapeGame.js` | [x] | [x] | [x] | Identical in both games |
| 8 | Preferences | Fix `longIntroEnabled` reactivity bug | `BaseGame.js` | [x] | [x] | [x] | **BUG:** BaseGame has its own `longIntroEnabled` from `useState` that never updates after mount. Must become reactive via `preferencesUpdated` event. Currently even after syncing prefs the intro length doesn't change |
| 9 | Preferences | Move `handleUpdateUserPreferences` to BaseGame | `BaseGame.js`, `ColorGame.js`, `ShapeGame.js` | [x] | [x] | [x] | Identical callback in both games |
| 10 | Game flow | Move `CORRECT_RESPONSES` + `TRY_AGAIN_RESPONSES` to BaseGame | `BaseGame.js`, `ColorGame.js`, `ShapeGame.js` | [x] | [x] | [x] | ColorGame has arrays; ShapeGame uses inline strings — standardise both |
| 11 | Game flow | Move `QUESTION_VARIANTS` defaults to BaseGame | `BaseGame.js`, `ColorGame.js`, `ShapeGame.js` | [x] | [x] | [x] | BaseGame already accepts `questionVariants` prop; add defaults there. ShapeGame now passes its own QUESTION_VARIANTS (same set, "shape" swapped for "color") |
| 12 | Game flow | Generalise `handleVoiceCommand` flow in BaseGame | `BaseGame.js`, `ColorGame.js`, `ShapeGame.js` | [x] | [x] | [x] | Games provide `matchItem(transcript)` → `{item, isCorrect}` or null. BaseGame owns speak→advance logic. See detail below. |
| 13 | Game flow | Add `SHAPE_ALIASES` to ShapeGame | `ShapeGame.js` | [x] | [x] | [x] | See aliases table below. Test and refine during real use. |
| 14 | Game flow | Standardise ShapeGame correct/wrong voice responses | `ShapeGame.js` | [x] | [x] | [x] | Currently uses inline strings ("Well done! It's a circle"). Use CORRECT_RESPONSES + TRY_AGAIN_RESPONSES arrays from BaseGame |
| 15 | UI | Move `renderGameContent` Start/Stop buttons to BaseGame | `BaseGame.js`, `ColorGame.js`, `ShapeGame.js` | [ ] | [ ] | [ ] | Add `accentColor` prop. Color: `from-purple-600 to-blue-600`. Shape: `from-blue-600 to-green-500` |
| 16 | Settings | Create shared `GameSettings.js` modal component | `GameSettings.js` (new) | [ ] | [ ] | [ ] | See detail below. Replaces duplicate modal shell in both settings files |
| 17 | Settings | Refactor `ColorGameSettings` to use `GameSettings` | `ColorGameSettings.js` | [ ] | [ ] | [ ] | Pass `renderItem` that shows colour swatch |
| 18 | Settings | Refactor `ShapeGameSettings` to use `GameSettings` | `ShapeGameSettings.js` | [ ] | [ ] | [ ] | Pass `renderItem` that shows shape SVG |
| 19 | Misc | Move `isIntroComplete` / `setIsIntroComplete` state to BaseGame | `BaseGame.js`, `ColorGame.js`, `ShapeGame.js` | [ ] | [ ] | [ ] | Currently managed in game component and passed down unnecessarily |
| 20 | Misc | Fix home page name not updating on preferences change | `page.js` | [ ] | [ ] | [ ] | Add `preferencesUpdated` listener to re-read `userPreferencesName` |

---

## Detailed Notes Per Item

### Item 8 — longIntroEnabled reactivity bug (IMPORTANT)

**Current broken behaviour:** BaseGame.js line ~65:
```js
const [longIntroEnabled] = useState(
  () => typeof window !== 'undefined' ? localStorage.getItem('gameLongIntro') !== 'false' : true
)
```
This reads localStorage only on mount and is never updated. Even though ColorGame and ShapeGame update their own `longIntroEnabled` via the `preferencesUpdated` event, BaseGame's copy (which is the one actually used in `startGame`) never changes.

**Fix:** After moving preferences to BaseGame (items 5–9), include `longIntroEnabled` in the `preferencesUpdated` sync and make it a regular `useState` with a setter:
```js
const [longIntroEnabled, setLongIntroEnabled] = useState(...)
// In sync handler:
setLongIntroEnabled(localStorage.getItem('gameLongIntro') !== 'false')
```

---

### Item 12 — Generalised handleVoiceCommand interface

**Current:** Each game has `handleVoiceCommand(transcript, speak)` which handles matching AND speaking AND advancing. BaseGame calls it and uses the return value to reset the inactivity timer.

**New interface:** Games provide `matchItem(transcript)` → returns the matched item name (string) if any color/shape word found, or `null`. BaseGame owns the correct/wrong/advance flow using CORRECT_RESPONSES, TRY_AGAIN_RESPONSES, and the `speak` function.

**ColorGame `matchItem` stays responsible for:**
- Multi-word detection (`mentionedSelected` filter for "is it blue or green?")
- `COLOR_ALIASES` matching
- `anyKnownColor` detection (deselected color → try again)
- "show me [color]" command
- "what color is it?" hint command

**ShapeGame `matchItem` stays responsible for:**
- `SHAPE_ALIASES` matching (new)
- Article logic ("a square", "an oval") for correct responses
- "show me [shape]" command  
- "what shape is it?" hint command

**BaseGame flow after `matchItem` returns:**
```js
const matched = matchItem(transcript)
if (matched?.isCorrect) {
  speak(CORRECT_RESPONSES[...](matched.item)).then(async () => {
    const next = selectNewItem(selectedItems, matched.item)
    updateCurrentItem(next)
    await speak(questionVariant)
  })
} else if (matched?.item) {
  speak(TRY_AGAIN_RESPONSES[...])
}
return matched?.item  // for inactivity timer reset
```

---

### Item 13 — Shape Aliases

Add to `ShapeGame.js` alongside the `itemTable`. These are initial guesses based on phonetics — **must be tested during real gameplay and refined**. Deepgram Nova-2 will mishear differently than Whisper did.

```js
const SHAPE_ALIASES = {
  triangle: ['try angle', 'trying', 'try angel', 'tri angle'],
  square:   ['scare', 'squire', 'swear', 'squared'],
  circle:   ['surgical', 'surreal', 'circles', 'circled'],
  oval:     ['over', 'opal', 'able', 'oh well'],
  diamond:  ['die man', 'diamonds', 'diemond'],
  star:     ['store', 'scar', 'stare', 'start', 'stars'],
}

const matchesAlias = (command, shape) =>
  SHAPE_ALIASES[shape]?.some(alias => new RegExp(`\\b${alias}\\b`).test(command))
```

---

### Item 15 — renderGameContent / accentColor prop

**Current:** Both games define an identical `renderGameContent` callback with only button gradient class differing.

**New BaseGame props:**
```js
accentColor = 'from-purple-600 to-blue-600'  // default (Color game)
// ShapeGame passes: accentColor="from-blue-600 to-green-500"
```

BaseGame renders Start/Stop buttons internally using `accentColor`. The `renderGameContent` prop is removed entirely.

---

### Item 16 — Shared GameSettings component

**New file:** `src/app/components/GameSettings.js`

**Props:**
```js
{
  title,           // "Color Game Settings" / "Shape Game Settings"
  onClose,
  onSave,
  itemTable,
  selectedItems,
  renderItem,      // (item, value) => JSX  — color swatch or shape SVG
  accentColor,     // save button gradient
  minItems = 2,
  minItemsLabel,   // "colors" / "shapes"
}
```

**Shell (shared):** backdrop, card, close button, outside-click, 2-column grid, min-items warning, reset/save buttons.

**ColorGameSettings renderItem:**
```js
(item, color) => (
  <div className="flex items-center gap-3">
    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: color }} />
    <span className="capitalize font-medium">{item}</span>
  </div>
)
```

**ShapeGameSettings renderItem:**
```js
(item, src) => (
  <>
    <div className="w-8 h-8 flex items-center justify-center mr-3">
      <Image src={src} alt={item} width={32} height={32} className="invert" />
    </div>
    <span className="capitalize font-medium">{item}</span>
  </>
)
```

**Note:** `ColorGameSettings` uses `bg-[var(--gray-800)]` for the card background; `ShapeGameSettings` uses `bg-[#1F2937]`. Unify to `bg-[var(--gray-800)]` (or whichever is correct — verify visually).

---

## Recommended Work Order

Work in these groups. Build and verify each group before starting the next. Commit each group separately with a clear message.

1. **Group 1 — Cleanup** (items 1–4): Safe removals, no behaviour change. Easiest to verify.
2. **Group 2 — Preferences** (items 5–9): Move all prefs state to BaseGame. Fix the longIntroEnabled bug. Test that prefs still apply correctly in both games.
3. **Group 3 — Game flow** (items 10–14): Move response arrays, generalise matchItem interface, add shape aliases. **Most complex group — take care.**
4. **Group 4 — UI** (item 15): Move Start/Stop buttons to BaseGame.
5. **Group 5 — Settings modals** (items 16–18): Create GameSettings, refactor both settings files.
6. **Group 6 — Misc** (items 19–20): isIntroComplete cleanup, home page name fix.

After all groups: full build, run through user test checklist below, commit, merge to main.

---

## User Testing Checklist

These are things only a human can verify. Run through the entire list on the Color Game, then repeat for Shape Game.

### Both games
- [ ] Home page shows correct name ("Hi [name]!") after changing name in preferences
- [ ] Home page name updates immediately when preferences are changed (no reload needed)
- [ ] Voice preferences (voice, speed) set from home page apply when game starts
- [ ] Voice preferences set on the game page before Start apply when game starts
- [ ] Intro length (brief/full) set from home page applies when game starts
- [ ] Intro length set on game page before Start applies when game starts
- [ ] Short intro says "Let's practice MindSight with [game]s!"
- [ ] Long intro says "Let's practice MindSight with [colors/shapes], [name]! ..."
- [ ] Game responds to voice correctly (correct answer accepted, wrong answer tries again)
- [ ] Saying "next" advances to next item
- [ ] Tapping/clicking screen advances to next item
- [ ] Saying "stop" ends game with normal outro
- [ ] Clicking Stop Game button ends game with normal outro (NOT timeout message)
- [ ] Outro cycles through variants across multiple game sessions
- [ ] Timeout after 2 minutes of silence says just "Goodbye!"
- [ ] VAD stops after 5 minutes idle, resumes on tap
- [ ] Saying "help" gives correct instructions
- [ ] Saying "what [color/shape] is it?" gives a hint
- [ ] Game settings modal opens (gear icon), saves correctly, closes correctly
- [ ] Minimum 2 items enforced in settings

### Color Game specific
- [ ] Multi-word answer accepted: "Is it blue or green?" when blue is correct → correct response
- [ ] Color alias: saying "play" accepted as "blue"
- [ ] Deselected color mentioned → try again response (not crash)
- [ ] Background changes to correct color on each new item

### Shape Game specific
- [ ] Shape aliases work (test each one listed above during play)
- [ ] Articles correct: "a square", "an oval", "a triangle", "a circle", "a diamond", "a star"
- [ ] Shape SVG renders correctly for each shape
- [ ] Shape SVG is white (inverted) during game play

### Voice & audio
- [ ] Preview voice in preferences matches actual game voice
- [ ] Speed slider affects playback speed correctly
- [ ] TTS cache: repeated phrases don't cause extra latency after first play
- [ ] Deepgram STT transcribes short words reliably ("red", "blue", "star")

---

## What NOT to change

- All visual styling, animations, colours, fonts
- API routes (`/api/speak`, `/api/transcribe`) — no changes
- `SpeechHandler.js` — no changes
- `Header.js` — no changes
- `UserPreferences.js` — no changes needed (already fixed)
- `FloatingBubble.js` — no changes
- `VoiceControls.js` — not used; leave as-is
- `metadata.js` — no changes
- `globals.css`, `tailwind.config.js` — no changes
- The three debug console.logs (see "Debug console.logs to KEEP" above)
- `server.js` — no changes
- `next.config.mjs` — no changes
- `.env.local` — no changes

---

## Potential Risks / Watch Points

1. **`useCallback` dependency arrays** — When moving state and callbacks to BaseGame, dependency arrays for `useCallback` and `useEffect` will need updating. ESLint will catch missing deps at build time.
2. **Prop drilling vs context** — Prefer props over context for the new shared state. Context already used for `GameStateContext` (global listening/speaking state) — don't add more.
3. **`currentItemRef` sync** — Both ColorGame and BaseGame currently maintain `currentItemRef`. After refactor, only BaseGame should own it. Watch for stale closure issues.
4. **`selectNewItem` ref** — BaseGame currently accepts `selectNewItemProp` as a prop because ColorGame has its own version. After item 4 (consolidate), ColorGame should pass the gameUtils version or let BaseGame use it directly.
5. **ShapeGame doesn't pass `questionVariants`** — After moving to BaseGame, ensure defaults are used correctly for ShapeGame.
6. **Build will catch ESLint errors** — The project has strict ESLint. Run `npm run build` (not just `npm run dev`) to catch all lint errors including empty catch blocks, unused vars etc.
