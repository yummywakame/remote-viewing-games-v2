'use client'

// Temporary debug page to verify sprite sheet positions — DELETE AFTER USE

const SHEET_W = 3762, SHEET_H = 1596, CARD_W = 241.882, CARD_H = 349.058
const COL_STEP = 264, ROW_STEP = 390, ORIGIN_X = 48.2, ORIGIN_Y = 48.9

function getCardStyle(col, row, dW = 80, dH = 116) {
  const sx = dW / CARD_W, sy = dH / CARD_H
  return {
    backgroundImage: 'url(/cards/deck.svg)',
    backgroundSize: `${SHEET_W * sx}px ${SHEET_H * sy}px`,
    backgroundPosition: `${-(ORIGIN_X + col * COL_STEP) * sx}px ${-(ORIGIN_Y + row * ROW_STEP) * sy}px`,
    backgroundRepeat: 'no-repeat',
  }
}

const SUITS = ['clubs', 'spades', 'hearts', 'diamonds']
const RANKS = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king']
const SUIT_ROW = { clubs: 0, spades: 1, hearts: 2, diamonds: 3 }
const RANK_COL = { ace: 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, jack: 11, queen: 12, king: 13 }

export default function DebugCards() {
  return (
    <div style={{ padding: 16, background: '#111', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 16 }}>Sprite Debug — col 0 (jokers) + all suits</h1>

      {/* Col 0 */}
      <div style={{ marginBottom: 16 }}>
        <b>Col 0, rows 0–3 (should be: black joker, back, back, red joker)</b>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {[0, 1, 2, 3].map(row => (
            <div key={row} style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 116, borderRadius: 6, overflow: 'hidden', ...getCardStyle(0, row) }} />
              <div style={{ fontSize: 10, marginTop: 4 }}>row {row}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Each suit row */}
      {SUITS.map(suit => (
        <div key={suit} style={{ marginBottom: 16 }}>
          <b>{suit} (row {SUIT_ROW[suit]}) — cols 1–13</b>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {RANKS.map(rank => (
              <div key={rank} style={{ textAlign: 'center' }}>
                <div style={{ width: 80, height: 116, borderRadius: 6, overflow: 'hidden', ...getCardStyle(RANK_COL[rank], SUIT_ROW[suit]) }} />
                <div style={{ fontSize: 10, marginTop: 2 }}>{rank}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
