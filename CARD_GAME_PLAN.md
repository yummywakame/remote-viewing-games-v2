# Card Game Implementation Plan

## Context

This is the **mindsight-training** Next.js 15 app (App Router, JavaScript/JSX, Tailwind CSS).
Working directory: `www/` (repo root).
Read `AGENTS.md` and `src/lib/gameConstants.js` for full project context before starting.

The card game has been fully designed through conversation. This document is the complete
implementation spec. Do not deviate from it without flagging first.

---

## Files to create

| File | Purpose |
|---|---|
| `src/app/card-game/page.js` | Route page (thin wrapper, same pattern as other games) |
| `src/app/components/CardGame.js` | Main game component |
| `src/app/components/CardDisplay.js` | Card visual — back face, front face, flip animation |
| `src/app/components/CardGameSettings.js` | Settings modal wrapper |

## Files to modify

| File | Change |
|---|---|
| `src/app/components/BaseGame.js` | Add `isCorrect: 'partial'` handling |
| `src/lib/gameConstants.js` | Add card game constants |
| `src/app/page.js` | Add card game to GAMES array on home page |

---

## Full game spec

### Deck composition
- 52 standard cards: ranks A 2 3 4 5 6 7 8 9 10 J Q K × suits ♠ ♥ ♦ ♣
- 2 jokers: **red joker** and **black joker** (optional, settings toggle)
- Total with jokers: 54 cards

### Card identity
Each card is keyed as a string: `"queen_of_diamonds"`, `"ace_of_spades"`, `"red_joker"`, `"black_joker"`.

```js
const SUITS = ['spades', 'hearts', 'diamonds', 'clubs']
const RANKS = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king']
const RED_SUITS = ['hearts', 'diamonds']
const BLACK_SUITS = ['spades', 'clubs']

const SUIT_SYMBOLS = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }
const SUIT_DISPLAY = { spades: 'spades', hearts: 'hearts', diamonds: 'diamonds', clubs: 'clubs' }
const RANK_DISPLAY = {
  ace: 'an ace', '2': 'a two', '3': 'a three', '4': 'a four', '5': 'a five',
  '6': 'a six', '7': 'a seven', '8': 'an eight', '9': 'a nine', '10': 'a ten',
  jack: 'a jack', queen: 'a queen', king: 'a king',
}
const RANK_LABELS = {
  ace: 'A', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7',
  '8': '8', '9': '9', '10': '10', jack: 'J', queen: 'Q', king: 'K',
}
```

Build `itemTable` as `{ [cardKey]: null }` for all cards in the active deck.
The value is `null` because card game doesn't use color-coded backgrounds like ColorGame.

### Settings (localStorage keys)
| Key | Value |
|---|---|
| `cardGameSelectedRanks` | JSON array of active ranks, e.g. `["ace","2","3",...]` |
| `cardGameSelectedSuits` | JSON array of active suits, e.g. `["spades","hearts","diamonds","clubs"]` |
| `cardGameJokersEnabled` | `"true"` / `"false"` |

Default: all ranks, all suits, jokers off.

### Settings UI (CardGameSettings.js)
The settings modal has THREE sections, not the standard single item grid:

1. **Rank grid** — 13 cells in a 7-col layout:
   - Row 1: A 2 3 4 5 6 7
   - Row 2: 8 9 10 J Q K (+ empty cell or full-width joker toggle)
   - Each cell shows the rank label (A, 2, 3... J, Q, K) with suit symbol for decoration
   - Min 2 ranks required (enforce same as other games)

2. **Suit grid** — 4 cells in a 4-col layout:
   - ♠ Spades | ♥ Hearts | ♦ Diamonds | ♣ Clubs
   - Min 1 suit required
   - Red suits in red, black suits in white/gray

3. **Joker toggle** — a Switch (like dark/light mode in shape/number games):
   - "Include Jokers" label with on/off Switch

Do NOT use the standard `GameSettings` wrapper for this — it's designed for a single
flat item table. `CardGameSettings` should be a custom modal following the same visual
style (`bg-[#12122e]`, `border-white/10`, indigo buttons etc.) but with its own layout.

### Match logic

The card game does NOT use the standard `CORRECT_RESPONSES` cycling array or
`TRY_AGAIN_RESPONSES` pool. It always uses fixed phrases:
- **Full correct**: `"It's [rank display] of [suit]!"` — e.g. `"It's a queen of diamonds!"`
- **Partial correct**: `"It is [suit]!"` or `"It is a [rank]!"` or `"It is [color]!"`
- **Try again**: `"Try again."`

#### isCorrect values

The card game introduces a new `isCorrect: 'partial'` value. BaseGame must handle this
(see BaseGame changes below). Summary:

| Return value | BaseGame behaviour |
|---|---|
| `isCorrect: true` | Speak correct text → advance (if auto-advance on) |
| `isCorrect: 'partial'` | Speak revealText → **never** advance → reset inactivity timer |
| `isCorrect: false` | Speak `"Try again."` → reset inactivity timer |
| `isCorrect: null` + revealText | Reveal the card → advance per auto-advance setting |
| `null` | Nothing matched → inactivity timer NOT reset |

#### matchItem logic (CardGame.js)

```js
function matchItem(transcript, speak) {
  const card = currentCardRef.current  // { rank, suit } or { joker: 'red'|'black' }
  if (!card) return null

  // --- Reveal commands ---
  if (/\b(what|which|reveal|show)\b/.test(transcript)) {
    return { item: cardKey(card), isCorrect: null, revealText: fullCardText(card) }
  }

  // --- Joker card ---
  if (card.joker) {
    if (/\bjoker\b/.test(transcript)) {
      return { item: cardKey(card), isCorrect: true, displayItem: 'a joker' }
    }
    // colour guessing on jokers
    const color = extractColor(transcript)
    if (color) {
      const cardColor = card.joker  // 'red' or 'black'
      return color === cardColor
        ? { item: cardKey(card), isCorrect: 'partial', revealText: `It is ${color}!` }
        : { item: cardKey(card), isCorrect: false }
    }
    return { item: cardKey(card), isCorrect: false }
  }

  // --- Standard card ---
  const guessedRank = extractRank(transcript)
  const guessedSuit = extractSuit(transcript)
  const guessedColor = extractColor(transcript)

  // Full guess: rank + suit
  if (guessedRank && guessedSuit) {
    if (guessedRank === card.rank && guessedSuit === card.suit)
      return { item: cardKey(card), isCorrect: true, displayItem: fullCardText(card) }
    if (guessedRank === card.rank)
      return { item: cardKey(card), isCorrect: 'partial', revealText: `It is ${RANK_DISPLAY[card.rank]}!` }
    if (guessedSuit === card.suit)
      return { item: cardKey(card), isCorrect: 'partial', revealText: `It is ${card.suit}!` }
    return { item: cardKey(card), isCorrect: false }
  }

  // Rank only
  if (guessedRank) {
    return guessedRank === card.rank
      ? { item: cardKey(card), isCorrect: 'partial', revealText: `It is ${RANK_DISPLAY[card.rank]}!` }
      : { item: cardKey(card), isCorrect: false }
  }

  // Suit only
  if (guessedSuit) {
    return guessedSuit === card.suit
      ? { item: cardKey(card), isCorrect: 'partial', revealText: `It is ${card.suit}!` }
      : { item: cardKey(card), isCorrect: false }
  }

  // Colour only
  if (guessedColor) {
    const cardColor = RED_SUITS.includes(card.suit) ? 'red' : 'black'
    return guessedColor === cardColor
      ? { item: cardKey(card), isCorrect: 'partial', revealText: `It is ${guessedColor}!` }
      : { item: cardKey(card), isCorrect: false }
  }

  return null
}
```

#### STT extraction helpers

```js
// Ranks — word boundaries, handle "10" as special case
const RANK_WORDS = {
  ace: 'ace', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  jack: 'jack', queen: 'queen', king: 'king',
}
const RANK_ALIASES = {
  ace: ['aces'],
  jack: ['jacks', 'jak'],
  queen: ['queens', 'keen'],  // Deepgram sometimes mishears
  king: ['kings', 'keen'],
  '10': ['ten'],
}

function extractRank(transcript) {
  for (const [word, rank] of Object.entries(RANK_WORDS)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(transcript)) return rank
  }
  // check aliases
  for (const [rank, aliases] of Object.entries(RANK_ALIASES)) {
    if (aliases.some(a => new RegExp(`\\b${a}\\b`, 'i').test(transcript))) return rank
  }
  return null
}

const SUIT_WORDS = { spades: 'spades', hearts: 'hearts', diamonds: 'diamonds', clubs: 'clubs' }
const SUIT_ALIASES = {
  spades: ['spade'],
  hearts: ['heart'],
  diamonds: ['diamond'],
  clubs: ['club', 'gloves'],  // Deepgram mishearing
}

function extractSuit(transcript) {
  for (const [word, suit] of Object.entries(SUIT_WORDS)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(transcript)) return suit
  }
  for (const [suit, aliases] of Object.entries(SUIT_ALIASES)) {
    if (aliases.some(a => new RegExp(`\\b${a}\\b`, 'i').test(transcript))) return suit
  }
  return null
}

function extractColor(transcript) {
  if (/\bred\b/i.test(transcript)) return 'red'
  if (/\bblack\b/i.test(transcript)) return 'black'
  return null
}
```

#### Spoken card text helpers

```js
function cardKey(card) {
  if (card.joker) return `${card.joker}_joker`
  return `${card.rank}_of_${card.suit}`
}

function fullCardText(card) {
  if (card.joker) return `It's the ${card.joker} joker!`
  return `It's ${RANK_DISPLAY[card.rank]} of ${card.suit}!`
}
```

---

## BaseGame.js changes

In `handleTranscript`, the current `else if (matched?.item)` branch handles `isCorrect: null`
(reveal). Add a new branch for `isCorrect: 'partial'` **between** the `isCorrect: false` branch
and the `isCorrect: null` branch:

```js
// EXISTING:
} else if (matched?.isCorrect === false) {
  setLastHeardWord(matched.item)
  setLastInteraction(Date.now())
  speakRef.current?.(TRY_AGAIN_RESPONSES[Math.floor(Math.random() * TRY_AGAIN_RESPONSES.length)])

// ADD THIS:
} else if (matched?.isCorrect === 'partial') {
  setLastHeardWord(matched.item)
  setLastInteraction(Date.now())
  if (matched.revealText) {
    speakRef.current?.(matched.revealText)
  }

// EXISTING (unchanged):
} else if (matched?.item) {
  // ... null / reveal handling
}
```

Note: The card game passes its own `"Try again."` string directly. To support this,
CardGame's `matchItem` returns `isCorrect: false` and the standard `TRY_AGAIN_RESPONSES`
random picker fires. But the spec says always say `"Try again."` for the card game.

**Solution:** Add an optional `tryAgainText` field to the matched result. In BaseGame,
if `matched.tryAgainText` is present, use it instead of the random pool:

```js
} else if (matched?.isCorrect === false) {
  setLastHeardWord(matched.item)
  setLastInteraction(Date.now())
  const tryAgainMsg = matched.tryAgainText ??
    TRY_AGAIN_RESPONSES[Math.floor(Math.random() * TRY_AGAIN_RESPONSES.length)]
  speakRef.current?.(tryAgainMsg)
```

CardGame always returns `{ ..., isCorrect: false, tryAgainText: 'Try again.' }` for wrong guesses.

---

## CardDisplay.js — card visuals

### Sprite sheet

The deck SVG is at `public/cards/deck.svg`. Do NOT use the card backs from this file —
use the custom-designed CSS card back instead (see below).

**SVG analysis (verified):**
- ViewBox: `0 0 3762 1596`
- Card size in SVG units: `241.882 × 349.058`
- Column spacing: `~264 units` (card width + gap)
- Row spacing: `~390 units` (card height + gap)
- Grid origin (first card top-left): approximately `x=48.2, y=48.9`
- Grid: **14 columns × 4 rows**

**Grid layout:**

| Row | Col 0 | Cols 1–13 |
|---|---|---|
| 0 | Black Joker | Clubs: A 2 3 4 5 6 7 8 9 10 J Q K |
| 1 | Card back ← **SKIP** | Spades: A 2 3 4 5 6 7 8 9 10 J Q K |
| 2 | Card back ← **SKIP** | Hearts: A 2 3 4 5 6 7 8 9 10 J Q K |
| 3 | Red Joker | Diamonds: A 2 3 4 5 6 7 8 9 10 J Q K |

**Do not use the card backs from the sprite sheet** (rows 1–2, col 0). The user does not
want those designs. Use the custom CSS card back (see below).

**Sprite position map:**

```js
// Maps suit → sprite row
const SUIT_ROW = { clubs: 0, spades: 1, hearts: 2, diamonds: 3 }

// Maps rank → sprite column (col 0 is joker/back)
const RANK_COL = {
  ace: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, jack: 11, queen: 12, king: 13,
}

// Jokers
const JOKER_POS = { black: { col: 0, row: 0 }, red: { col: 0, row: 3 } }

// SVG sheet dimensions
const SHEET_W = 3762
const SHEET_H = 1596
const CARD_W = 241.882   // card width in SVG units
const CARD_H = 349.058   // card height in SVG units
const COL_STEP = 264     // x distance between card left edges
const ROW_STEP = 390     // y distance between card top edges
const ORIGIN_X = 48.2    // x of col 0 left edge
const ORIGIN_Y = 48.9    // y of row 0 top edge
```

**CSS sprite rendering:**

To display a card at a given CSS size (`displayW × displayH`):

```js
function getCardStyle(col, row, displayW, displayH) {
  // Scale factor: how much larger/smaller than 1 SVG unit
  const scaleX = displayW / CARD_W
  const scaleY = displayH / CARD_H
  const bgW = SHEET_W * scaleX
  const bgH = SHEET_H * scaleY
  const offsetX = -(ORIGIN_X + col * COL_STEP) * scaleX
  const offsetY = -(ORIGIN_Y + row * ROW_STEP) * scaleY
  return {
    backgroundImage: 'url(/cards/deck.svg)',
    backgroundSize: `${bgW}px ${bgH}px`,
    backgroundPosition: `${offsetX}px ${offsetY}px`,
    backgroundRepeat: 'no-repeat',
  }
}
```

### Card dimensions (CSS display size)

Recommended display size: **160px × 232px** (maintains the ~0.69 aspect ratio of the sprite).
Scale up/down as needed. Apply `border-radius: 12px` and `overflow: hidden` on the container.

### Card back (custom — do NOT use sprite sheet backs)

The card backs in the sprite sheet (rows 1–2, col 0) are not wanted. Use this custom
indigo-themed CSS back instead:

```jsx
function CardBack() {
  return (
    <div className="w-full h-full bg-indigo-900 rounded-2xl border-4 border-indigo-700 shadow-2xl relative overflow-hidden">
      <div className="absolute inset-3 rounded-xl border border-indigo-500/30 flex items-center justify-center">
        <div className="grid grid-cols-3 gap-3 opacity-20 text-indigo-300 text-xl select-none">
          {Array(9).fill('✦').map((s, i) => <span key={i}>{s}</span>)}
        </div>
      </div>
    </div>
  )
}
```

### Card front (sprite sheet)

```jsx
function CardFront({ rank, suit, isJoker, jokerColor }) {
  const col = isJoker ? 0 : RANK_COL[rank]
  const row = isJoker ? JOKER_POS[jokerColor].row : SUIT_ROW[suit]
  const style = getCardStyle(col, row, 160, 232)  // adjust display size as needed

  return (
    <div
      className="w-full h-full rounded-2xl shadow-2xl overflow-hidden"
      style={style}
    />
  )
}
```

### Flip animation

Use Framer Motion with CSS 3D transforms. The parent needs `perspective`.
Two approaches — use the simpler one:

```jsx
// Parent wrapper (in CardDisplay)
<div style={{ perspective: '1000px', width: 200, height: 280 }}>
  <motion.div
    style={{ transformStyle: 'preserve-3d', width: '100%', height: '100%', position: 'relative' }}
    animate={{ rotateY: isFlipped ? 180 : 0 }}
    transition={{ duration: 0.4, ease: 'easeInOut' }}
  >
    {/* Back face */}
    <div style={{ backfaceVisibility: 'hidden', position: 'absolute', width: '100%', height: '100%' }}>
      <CardBack />
    </div>
    {/* Front face */}
    <div style={{ backfaceVisibility: 'hidden', position: 'absolute', width: '100%', height: '100%', transform: 'rotateY(180deg)' }}>
      <CardFront rank={rank} suit={suit} isJoker={isJoker} jokerColor={jokerColor} />
    </div>
  </motion.div>
</div>
```

`isFlipped` is a boolean prop. CardGame manages it as state.

---

## CardGame.js — state and card management

```js
// State
const [currentCard, setCurrentCard] = useState(null)  // { rank, suit } | { joker: 'red'|'black' } | null
const [isFlipped, setIsFlipped] = useState(false)      // true = front showing
const [selectedRanks, setSelectedRanks] = useState(RANKS)
const [selectedSuits, setSelectedSuits] = useState(SUITS)
const [jokersEnabled, setJokersEnabled] = useState(false)
const currentCardRef = useRef(null)  // for use inside matchItem callback
```

### Building the active deck

```js
function buildDeck(ranks, suits, jokersEnabled) {
  const cards = []
  for (const suit of suits) {
    for (const rank of ranks) {
      cards.push(`${rank}_of_${suit}`)
    }
  }
  if (jokersEnabled) {
    cards.push('red_joker', 'black_joker')
  }
  return cards
}
```

Pass `buildDeck(selectedRanks, selectedSuits, jokersEnabled)` as `selectedItems` to BaseGame.
Use a custom `selectNewItemProp` that picks randomly from the deck (excluding the current card).

### Card object from key

```js
function parseCardKey(key) {
  if (key === 'red_joker') return { joker: 'red' }
  if (key === 'black_joker') return { joker: 'black' }
  const [rank, , suit] = key.split('_')  // "queen_of_diamonds"
  return { rank, suit }
}
```

### Flip / reveal flow

When `matchItem` returns `isCorrect: null` (reveal), BaseGame calls `speak(revealText)` and
then advances (if auto-advance on). But the card flip animation is visual-only — CardGame
needs to control it separately.

**Approach:** CardGame exposes a `onReveal` callback that BaseGame calls when
`isCorrect: null` is returned. But BaseGame doesn't have that hook.

**Simpler approach:** Pass a ref into `matchItem`. When the reveal command is detected
inside `matchItem`, CardGame flips the card immediately via `setIsFlipped(true)`, and
returns `{ isCorrect: null, revealText: ... }` for BaseGame to handle audio + advance.

```js
const matchItem = useCallback((transcript, speak) => {
  const card = currentCardRef.current
  if (!card) return null

  if (/\b(what|which|reveal|show)\b/.test(transcript)) {
    setIsFlipped(true)  // flip immediately on reveal command
    return { item: cardKey(card), isCorrect: null, revealText: fullCardText(card) }
  }
  // ... rest of match logic
}, [])
```

### Advance to next card

When BaseGame advances (after full correct, or after reveal with auto-advance on), it calls
`onCurrentItemUpdate(newItem)`. CardGame's handler:

```js
const handleItemUpdate = useCallback((newKey) => {
  if (!newKey) {
    setCurrentCard(null)
    setIsFlipped(false)
    return
  }
  // If current card was NOT revealed before advancing, briefly flash the front
  if (!isFlippedRef.current) {
    setIsFlipped(true)         // flash front for 600ms
    setTimeout(() => {
      setCurrentCard(parseCardKey(newKey))
      currentCardRef.current = parseCardKey(newKey)
      setIsFlipped(false)      // flip back to show back of new card
    }, 600)
  } else {
    // Was already revealed — just swap the card and show the back
    setCurrentCard(parseCardKey(newKey))
    currentCardRef.current = parseCardKey(newKey)
    setIsFlipped(false)
  }
}, [])
```

Keep `isFlippedRef` in sync with `isFlipped` state for use inside the callback.

---

## gameConstants.js additions

Add to the bottom of `gameConstants.js`:

```js
// ---------- Card game ----------

export const CARD_QUESTION_VARIANTS = [
  'Next. What card do you sense?',
  'Next. What do you pick up?',
  'Next. What card is this?',
  'Next. And this one?',
  'Next. What about this card?',
  'Next. What do you sense?',
]

export const CARD_TRY_AGAIN = 'Try again.'
```

Also add `'Card'` to any `gameType` switch/map in `getFirstQuestion`, `getHelpText`, `getTipText`,
`getBriefIntro`, `getLongIntroNoName`, `getAdvanceHint` in `gameConstants.js`.

Check each of those functions — they likely use a `gameType` string. Add a `'Card'` case:
- `getFirstQuestion('Card')` → `'What card do you sense?'`
- `getHelpText('Card')` → same pattern as other games, with card-specific commands
- `getBriefIntro('Card')` → `"Let's begin! I'll show you cards. Tell me the card, the suit, the rank, or the colour."`
- `getLongIntroNoName('Card')` → longer version of above
- `getAdvanceHint('Card')` → `'Say "next" to continue.'`
- `getTipText('Card')` → `'Try saying the suit, the rank, or the colour.'`

---

## page.js (home page) change

Add the card game to the `GAMES` array:

```js
{ name: 'Card Game', href: '/card-game', icon: /* some icon */, color: 'from-red-600 to-yellow-500', available: true },
```

Good Lucide icon options: `Club`, `Spade`, `Diamond`, `Heart` — check which are available.
If none, use `Layers` or `Grid` as a fallback.

---

## card-game/page.js

Follow the exact same pattern as `number-game/page.js`:

```jsx
'use client'
import { useState, useCallback } from 'react'
import { GameStateContext } from '../layout'
import { useContext } from 'react'
import CardGame from '@/app/components/CardGame'
import CosmicBackground from '@/app/components/CosmicBackground'

export default function CardGamePage() {
  const { isGamePlaying } = useContext(GameStateContext)
  const [gameState, setGameState] = useState('initial')

  const handleGameStateChange = useCallback((state) => {
    setGameState(state)
  }, [])

  return (
    <>
      {!isGamePlaying && (
        <div className="fixed-full">
          <CosmicBackground />
        </div>
      )}
      <div className="relative min-h-screen">
        <CardGame onGameStateChange={handleGameStateChange} />
      </div>
    </>
  )
}
```

---

## Audio / TTS note

The card game phrases will NOT be in the static audio manifest (`public/audio/{voice}/manifest.json`)
until `npm run audio:sync` is run with the card game phrases added to `scripts/phraseList.mjs`.

**This is fine and expected.** The `speak()` function automatically falls through to the
`/api/speak` API when a phrase isn't found in the manifest. All card game audio will hit the
API during development. Do not add card game phrases to `phraseList.mjs` yet — that comes later
once phrasing is finalized.

---

## Implementation order (recommended)

1. `gameConstants.js` — add card constants and gameType cases
2. `BaseGame.js` — add `isCorrect: 'partial'` and `tryAgainText` handling
3. `CardDisplay.js` — CardBack, CardFront, flip animation
4. `CardGame.js` — state, deck building, matchItem, settings wiring
5. `CardGameSettings.js` — custom settings modal (ranks grid + suits grid + joker toggle)
6. `card-game/page.js` — thin route wrapper
7. `page.js` — add to home GAMES array

Test after each step. The dev server hot-reloads on save.

---

## Key conventions to follow

- All Tailwind for styling — no inline styles except where required for 3D transforms
- `'use client'` at top of all component files
- `memo()` wrap on main game component (see NumberGame pattern)
- `useCallback` on all handlers and matchItem
- `useRef` alongside state for any value used inside callbacks (stale closure trap)
- `isomorphic-dompurify` `sanitize()` on any user-sourced string before rendering
- Import paths use `@/` alias (configured in `jsconfig.json`)
- The `GameStateContext` (from `src/app/layout.js`) provides: `setIsListening`, `setIsSpeaking`,
  `setOnOpenGameSettings`, `setIsGamePlaying`, `setExitGame`
- `BaseGame` handles all voice, timing, inactivity, settings modal open, exit game — do not duplicate
- Card game accent color suggestion: `from-red-600 to-yellow-500` (warm card-table feel)
