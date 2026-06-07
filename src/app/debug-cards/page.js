'use client'

// Temporary debug page to verify deck3.png sprite positions — DELETE AFTER USE

const SHEET_W = 3120, SHEET_H = 1220, CARD_W = 217, CARD_H = 297
const COL_STEP = 221.69, ROW_STEP = 302, ORIGIN_X = 10, ORIGIN_Y = 7

function getCardStyle(col, row, dW = 80, dH = 112) {
  const sx = dW / CARD_W, sy = dH / CARD_H
  return {
    backgroundImage: 'url(/cards/deck3.png)',
    backgroundSize: `${SHEET_W * sx}px ${SHEET_H * sy}px`,
    backgroundPosition: `${-(ORIGIN_X + col * COL_STEP) * sx}px ${-(ORIGIN_Y + row * ROW_STEP) * sy}px`,
    backgroundRepeat: 'no-repeat',
  }
}

const SUITS = ['diamonds', 'clubs', 'hearts', 'spades']
const RANKS = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king']
const SUIT_ROW = { diamonds: 0, clubs: 1, hearts: 2, spades: 3 }
const RANK_COL = { ace: 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6, '8': 7, '9': 8, '10': 9, jack: 10, queen: 11, king: 12 }

export default function DebugCards() {
  return (
    <div style={{ padding: 16, background: '#111', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 8 }}>Sprite Debug — deck3.png</h1>
      <p style={{ marginBottom: 16, fontSize: 12, color: '#aaa' }}>
        ORIGIN_X={ORIGIN_X} ORIGIN_Y={ORIGIN_Y} COL_STEP={COL_STEP} ROW_STEP={ROW_STEP} CARD_W={CARD_W} CARD_H={CARD_H}
      </p>

      {/* Col 13 special cards */}
      <div style={{ marginBottom: 20 }}>
        <b>Col 13 (special) — row 0=red joker, row 1=black joker, rows 2 &amp; 3=identical blank/back design</b>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {[0, 1, 2, 3].map(row => (
            <div key={row} style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 112, borderRadius: 6, overflow: 'hidden', ...getCardStyle(13, row) }} />
              <div style={{ fontSize: 10, marginTop: 4 }}>col13 row{row}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Each suit row */}
      {SUITS.map(suit => (
        <div key={suit} style={{ marginBottom: 16 }}>
          <b>{suit} (row {SUIT_ROW[suit]}) — ace through king</b>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {RANKS.map(rank => (
              <div key={rank} style={{ textAlign: 'center' }}>
                <div style={{ width: 80, height: 112, borderRadius: 6, overflow: 'hidden', ...getCardStyle(RANK_COL[rank], SUIT_ROW[suit]) }} />
                <div style={{ fontSize: 10, marginTop: 2 }}>{rank}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
