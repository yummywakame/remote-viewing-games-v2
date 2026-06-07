'use client'

import { motion } from 'framer-motion'

// Sprite sheet registry — each deck has its own grid layout and suit/rank positions.
// 'deck1' (deck3.png) is the current default deck; 'deck2' (deck2.png) is the previous one, kept as an alternative.
export const CARD_DECKS = {
  deck1: {
    label: 'Deck 1',
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
  },
  deck2: {
    label: 'Deck 2',
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

// Crop style for a deck's card-back design — used for small previews (e.g. deck picker thumbnails)
export function getDeckBackStyle(deckId) {
  const deck = CARD_DECKS[deckId] ?? CARD_DECKS[DEFAULT_DECK]
  return getCardStyle(deck, deck.backPos.col, deck.backPos.row)
}

function CardFace({ deck, col, row }) {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl"
      style={getCardStyle(deck, col, row)}
    />
  )
}

// Shared display cap across decks — based on deck2's native card width at 80% scale,
// so both decks render at a consistent on-screen size regardless of native sprite resolution.
const MAX_DISPLAY_W = Math.round(CARD_DECKS.deck2.cardW * 0.8)

export default function CardDisplay({ card, isFlipped, deckId = DEFAULT_DECK }) {
  const deck = CARD_DECKS[deckId] ?? CARD_DECKS[DEFAULT_DECK]

  const isJoker = card?.joker != null
  const col = isJoker ? deck.jokerPos[card.joker]?.col ?? deck.jokerCol : (card ? deck.rankCol[card.rank] : deck.backPos.col)
  const row = isJoker ? deck.jokerPos[card.joker]?.row ?? 0 : (card ? deck.suitRow[card.suit] : deck.backPos.row)

  return (
    <div style={{
      perspective: '1000px',
      width: '100%',
      maxWidth: MAX_DISPLAY_W,
      aspectRatio: `${deck.cardW} / ${deck.cardH}`,
      position: 'relative',
    }}>
      <motion.div
        style={{ transformStyle: 'preserve-3d', position: 'absolute', inset: 0 }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        {/* Back face */}
        <div style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}>
          <CardFace deck={deck} col={deck.backPos.col} row={deck.backPos.row} />
        </div>
        {/* Front face */}
        <div style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0, transform: 'rotateY(180deg)' }}>
          {card && <CardFace deck={deck} col={col} row={row} />}
        </div>
      </motion.div>
    </div>
  )
}
