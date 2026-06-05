'use client'

import { motion } from 'framer-motion'

// Sprite sheet constants for deck2.svg (5000x2000 viewBox)
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

function getCardStyle(col, row, displayW, displayH) {
  const scaleX = displayW / CARD_W
  const scaleY = displayH / CARD_H
  const bgW = SHEET_W * scaleX
  const bgH = SHEET_H * scaleY
  const offsetX = -(ORIGIN_X + col * COL_STEP) * scaleX
  const offsetY = -(ORIGIN_Y + row * ROW_STEP) * scaleY
  return {
    backgroundImage: 'url(/cards/deck2.png)',
    backgroundSize: `${bgW}px ${bgH}px`,
    backgroundPosition: `${offsetX}px ${offsetY}px`,
    backgroundRepeat: 'no-repeat',
  }
}

function CardBack() {
  const style = getCardStyle(BACK_POS.col, BACK_POS.row, 160, 232)
  return <div className="w-full h-full rounded-2xl shadow-2xl overflow-hidden" style={style} />
}

function CardFront({ rank, suit, isJoker, jokerColor }) {
  const col = isJoker ? JOKER_POS[jokerColor].col : RANK_COL[rank]
  const row = isJoker ? JOKER_POS[jokerColor].row : SUIT_ROW[suit]
  const style = getCardStyle(col, row, 160, 232)

  return (
    <div
      className="w-full h-full rounded-2xl shadow-2xl overflow-hidden"
      style={style}
    />
  )
}

export default function CardDisplay({ card, isFlipped }) {
  const isJoker = card?.joker != null
  const jokerColor = card?.joker
  const rank = card?.rank
  const suit = card?.suit

  return (
    <div style={{ perspective: '1000px', width: 160, height: 232 }}>
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
          {card && (
            <CardFront rank={rank} suit={suit} isJoker={isJoker} jokerColor={jokerColor} />
          )}
        </div>
      </motion.div>
    </div>
  )
}
