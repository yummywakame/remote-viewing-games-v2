'use client'

import { motion } from 'framer-motion'

// Sprite sheet constants for deck2.png (5000x2000 logical grid)
const SHEET_W = 5000
const SHEET_H = 2000
const CARD_W = 340
const CARD_H = 475
const COL_STEP = 357.5
const ROW_STEP = 492
const ORIGIN_X = 3.5
const ORIGIN_Y = 4

const SUIT_ROW = { hearts: 0, spades: 1, diamonds: 2, clubs: 3 }
const RANK_COL = {
  ace: 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6,
  '8': 7, '9': 8, '10': 9, queen: 10, king: 11, jack: 12,
}
// Col 13: row 0 = red joker, row 1 = blue joker, row 2 = back A, row 3 = back B (used)
const JOKER_COL = 13
const JOKER_POS = { red: { col: JOKER_COL, row: 0 }, black: { col: JOKER_COL, row: 1 } }
const BACK_POS = { col: JOKER_COL, row: 3 }

// Percentage-based sprite positioning — works at any display size
function getCardStyle(col, row) {
  const ox = ORIGIN_X + col * COL_STEP
  const oy = ORIGIN_Y + row * ROW_STEP
  const bgSizeX = (SHEET_W / CARD_W) * 100
  const bgSizeY = (SHEET_H / CARD_H) * 100
  const bgPosX = (ox / (SHEET_W - CARD_W)) * 100
  const bgPosY = (oy / (SHEET_H - CARD_H)) * 100
  return {
    backgroundImage: 'url(/cards/deck2.png)',
    backgroundSize: `${bgSizeX}% ${bgSizeY}%`,
    backgroundPosition: `${bgPosX}% ${bgPosY}%`,
    backgroundRepeat: 'no-repeat',
  }
}

const INNER_BORDER = { boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.85)' }
const GLOSS = {
  position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit', zIndex: 1,
  background: [
    'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 50%, transparent 70%)',
    'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 30%)',
  ].join(', '),
}

function CardFace({ col, row }) {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-2xl"
      style={{ ...getCardStyle(col, row), ...INNER_BORDER }}
    >
      <div style={GLOSS} />
    </div>
  )
}

export default function CardDisplay({ card, isFlipped }) {
  const isJoker = card?.joker != null
  const col = isJoker ? JOKER_POS[card.joker]?.col ?? JOKER_COL : (card ? RANK_COL[card.rank] : BACK_POS.col)
  const row = isJoker ? JOKER_POS[card.joker]?.row ?? 0 : (card ? SUIT_ROW[card.suit] : BACK_POS.row)

  return (
    <div style={{
      perspective: '1000px',
      width: '100%',
      maxWidth: CARD_W,
      aspectRatio: `${CARD_W} / ${CARD_H}`,
      position: 'relative',
    }}>
      <motion.div
        style={{ transformStyle: 'preserve-3d', position: 'absolute', inset: 0 }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        {/* Back face */}
        <div style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}>
          <CardFace col={BACK_POS.col} row={BACK_POS.row} />
        </div>
        {/* Front face */}
        <div style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0, transform: 'rotateY(180deg)' }}>
          {card && <CardFace col={col} row={row} />}
        </div>
      </motion.div>
    </div>
  )
}
