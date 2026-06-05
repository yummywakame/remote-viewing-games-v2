'use client'

import { motion } from 'framer-motion'

// Sprite sheet constants
const SHEET_W = 3762
const SHEET_H = 1596
const CARD_W = 241.882
const CARD_H = 349.058
const COL_STEP = 264
const ROW_STEP = 390
const ORIGIN_X = 48.2
const ORIGIN_Y = 48.9

const SUIT_ROW = { clubs: 0, spades: 1, hearts: 2, diamonds: 3 }
const RANK_COL = {
  ace: 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6,
  '8': 7, '9': 8, '10': 9, jack: 10, queen: 11, king: 12,
}
const JOKER_POS = { black: { col: 13, row: 0 }, red: { col: 13, row: 3 } }

function getCardStyle(col, row, displayW, displayH) {
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

function CardFront({ rank, suit, isJoker, jokerColor }) {
  const col = isJoker ? 0 : RANK_COL[rank]
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
