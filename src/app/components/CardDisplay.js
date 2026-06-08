'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

// Sprite sheet registry — each deck has its own grid layout and suit/rank positions.
// 'deck1' (deck3.png) is the current default deck; 'deck2' (deck2.png) is the previous one, kept as an alternative.
export const CARD_DECKS = {
  deck1: {
    label: '#1',
    file: '/cards/deck3.png',
    sheetW: 3120, sheetH: 1220, cardW: 217, cardH: 297,
    colStep: 221.69, rowStep: 302, originX: 10, originY: 7,
    suitRow: { diamonds: 0, clubs: 1, hearts: 2, spades: 3 },
    rankCol: {
      ace: 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6,
      '8': 7, '9': 8, '10': 9, jack: 10, queen: 11, king: 12,
    },
    // Col 13: row 0 = red joker, row 1 = black joker, rows 2 & 3 = identical blank/back design
    jokerCol: 13,
    jokerPos: { red: { col: 13, row: 0 }, black: { col: 13, row: 1 } },
    backPos: { col: 13, row: 2 },
    // Custom card-back artwork (standalone SVG) — used instead of cropping backPos from the sheet
    backImage: '/cards/card-back-3.svg',
  },
  deck2: {
    label: '#2',
    file: '/cards/deck2.png',
    sheetW: 5000, sheetH: 2000, cardW: 340, cardH: 475,
    colStep: 357.5, rowStep: 492, originX: 3.5, originY: 4,
    suitRow: { hearts: 0, spades: 1, diamonds: 2, clubs: 3 },
    // Non-standard face card column order: queen=10, king=11, jack=12
    rankCol: {
      ace: 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6,
      '8': 7, '9': 8, '10': 9, queen: 10, king: 11, jack: 12,
    },
    // Col 13: row 0 = red joker, row 1 = blue joker, row 2 = back A, row 3 = back B (used)
    jokerCol: 13,
    jokerPos: { red: { col: 13, row: 0 }, black: { col: 13, row: 1 } },
    backPos: { col: 13, row: 3 },
  },
  deck3: {
    label: '#3',
    file: '/cards/deck4@2x.png',
    // Re-exported with a uniform grid (every card is exactly 429×620px on a 460×642 step) —
    // measured directly from the sheet via row/column white-pixel projection.
    sheetW: 6681, sheetH: 2761, cardW: 429, cardH: 617,
    colStep: 460, rowStep: 642, originX: 81, originY: 81,
    suitRow: { clubs: 0, diamonds: 1, spades: 2, hearts: 3 },
    rankCol: {
      ace: 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6,
      '8': 7, '9': 8, '10': 9, jack: 10, queen: 11, king: 12,
    },
    // Col 14: row 0 = black joker, row 1 = red joker, rows 2 & 3 = identical card-back design
    jokerCol: 13,
    jokerPos: { black: { col: 13, row: 0 }, red: { col: 13, row: 1 } },
    backPos: { col: 13, row: 2 },
  },
}

export const DEFAULT_DECK = 'deck1'

// Fraction of each cell's edge to crop away — hides the seam/gap between
// neighbouring sprites that otherwise bleeds in as a thin line, without the
// crop being noticeable. Sprite grids aren't perfectly uniform, so a global
// pixel-shift fixes some cells while breaking others; trimming the outer
// edge of every cell sidesteps the seam everywhere at once.
const EDGE_INSET_FRAC = 0.006

// Percentage-based sprite positioning — works at any display size
function getCardStyle(deck, col, row) {
  const insetX = deck.cardW * EDGE_INSET_FRAC
  const insetY = deck.cardH * EDGE_INSET_FRAC
  const visW = deck.cardW - 2 * insetX
  const visH = deck.cardH - 2 * insetY
  const ox = deck.originX + col * deck.colStep + insetX
  const oy = deck.originY + row * deck.rowStep + insetY
  const bgSizeX = (deck.sheetW / visW) * 100
  const bgSizeY = (deck.sheetH / visH) * 100
  const bgPosX = (ox / (deck.sheetW - visW)) * 100
  const bgPosY = (oy / (deck.sheetH - visH)) * 100
  return {
    backgroundImage: `url(${deck.file})`,
    backgroundSize: `${bgSizeX}% ${bgSizeY}%`,
    backgroundPosition: `${bgPosX}% ${bgPosY}%`,
    backgroundRepeat: 'no-repeat',
  }
}

// Style for a deck's card-back design — either a standalone image (backImage)
// or a crop from the sprite sheet (backPos). Used for both gameplay and small
// previews (e.g. deck picker thumbnails).
function getCardBackStyle(deck) {
  if (deck.backImage) {
    return {
      backgroundImage: `url(${deck.backImage})`,
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }
  return getCardStyle(deck, deck.backPos.col, deck.backPos.row)
}

export function getDeckBackStyle(deckId) {
  const deck = CARD_DECKS[deckId] ?? CARD_DECKS[DEFAULT_DECK]
  return getCardBackStyle(deck)
}

function CardFace({ style }) {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl"
      style={style}
    />
  )
}

// Shared display cap across decks — based on deck2's native card width at 80% scale,
// so both decks render at a consistent on-screen size regardless of native sprite resolution.
const MAX_DISPLAY_W = Math.round(CARD_DECKS.deck2.cardW * 0.8)

// Faux "deck of cards" the active card sits on — a thick stack of card-back layers
// peeking out from behind it by ~1px each (like real stacked cards), dimmed with
// distance to suggest depth. Offsets are in pixels (not %) so each layer reveals a
// consistent sliver regardless of display size.
const STACK_LAYER_COUNT = 20
const STACK_LAYERS = Array.from({ length: STACK_LAYER_COUNT }, (_, i) => {
  const depthFromFront = STACK_LAYER_COUNT - i
  return {
    offsetPx: depthFromFront,
    brightness: 0.4 + 0.5 * (i / (STACK_LAYER_COUNT - 1)),
  }
})

// Identity used to detect when the displayed card changes (for the "next card" animation)
function cardIdentity(card) {
  if (!card) return null
  if (card.joker) return `${card.joker}_joker`
  return `${card.rank}_of_${card.suit}`
}

export default function CardDisplay({ card, isFlipped, deckId = DEFAULT_DECK }) {
  const deck = CARD_DECKS[deckId] ?? CARD_DECKS[DEFAULT_DECK]

  const isJoker = card?.joker != null
  const col = isJoker ? deck.jokerPos[card.joker]?.col ?? deck.jokerCol : (card ? deck.rankCol[card.rank] : deck.backPos.col)
  const row = isJoker ? deck.jokerPos[card.joker]?.row ?? 0 : (card ? deck.suitRow[card.suit] : deck.backPos.row)
  const backStyle = getCardBackStyle(deck)

  // "Next card" flourish — when the displayed card changes, spawn a ghost copy of the
  // card-back that rises above the deck, then descends and slides behind it, coming to
  // rest exactly where the bottom card of the stack sits (so it appears to join the deck).
  const GHOST_DURATION = 0.95
  const [ghosts, setGhosts] = useState([])
  const prevIdentityRef = useRef(cardIdentity(card))
  const ghostIdRef = useRef(0)
  useEffect(() => {
    const identity = cardIdentity(card)
    const prev = prevIdentityRef.current
    prevIdentityRef.current = identity
    if (prev !== null && identity !== prev) {
      const id = ++ghostIdRef.current
      setGhosts((g) => [...g, id])
      const t = setTimeout(() => setGhosts((g) => g.filter((x) => x !== id)), GHOST_DURATION * 1000 + 50)
      return () => clearTimeout(t)
    }
  }, [card])

  return (
    <div style={{
      width: '100%',
      maxWidth: MAX_DISPLAY_W,
      aspectRatio: `${deck.cardW} / ${deck.cardH}`,
      position: 'relative',
      zIndex: 0, // establish a stacking context so the ghost's negative z-index stays local
    }}>
      {/* "Next card" flourish — ghost of the outgoing card rising above the deck, then
          sliding down behind it to settle into the bottom-of-stack position */}
      <AnimatePresence>
        {ghosts.map((id) => (
          <motion.div
            key={id}
            className="absolute rounded-2xl overflow-hidden shadow-xl"
            style={{ inset: 0 }}
            initial={{ x: 0, y: 0, zIndex: STACK_LAYERS.length + 1 }}
            animate={{
              x: [0, 0, STACK_LAYER_COUNT],
              y: [0, -46, STACK_LAYER_COUNT],
              zIndex: [STACK_LAYERS.length + 1, STACK_LAYERS.length + 1, -1],
            }}
            transition={{ duration: GHOST_DURATION, times: [0, 0.4, 1], ease: ['easeOut', 'easeInOut'] }}
          >
            <div className="w-full h-full" style={backStyle} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Stack of cards peeking out from behind the active card */}
      {STACK_LAYERS.map(({ offsetPx, brightness }, i) => (
        <div
          key={i}
          className="absolute rounded-2xl overflow-hidden shadow-xl"
          style={{
            inset: 0,
            transform: `translate(${offsetPx}px, ${offsetPx}px)`,
            filter: `brightness(${brightness})`,
            zIndex: i,
          }}
        >
          <div className="w-full h-full" style={backStyle} />
        </div>
      ))}

      {/* Active card */}
      <div style={{ perspective: '1000px', position: 'absolute', inset: 0, zIndex: STACK_LAYERS.length }}>
        <motion.div
          style={{ transformStyle: 'preserve-3d', position: 'absolute', inset: 0 }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {/* Back face */}
          <div style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}>
            <CardFace style={backStyle} />
          </div>
          {/* Front face */}
          <div style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0, transform: 'rotateY(180deg)' }}>
            {card && <CardFace style={getCardStyle(deck, col, row)} />}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
