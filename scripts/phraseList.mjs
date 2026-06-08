// Shared phrase list builder — used by both generate-audio.mjs and check-audio.mjs.
// Derives all pre-generable phrases directly from game constants, so edits to
// responses/items automatically flow through to the audio sync scripts.

import {
  CORRECT_RESPONSES, CONFIRM_ONLY_RESPONSES, TRY_AGAIN_RESPONSES, OUTRO_RESPONSES, TIMEOUT_MESSAGE, TRANSCRIPTION_ERROR_MESSAGE,
  GAMES,
  getHelpText, getTipText, getAdvanceHint, getFirstQuestion,
  getBriefIntro, getLongIntroNoName,
  CARD_QUESTION_VARIANTS, CARD_TRY_AGAIN, CARD_SUITS, CARD_RANKS, CARD_COLORS, CARD_RANK_DISPLAY,
  getFullCardText, getCardDisplayPhrase,
} from '../src/lib/gameConstants.js'

// The Card game has its own bespoke matching/response logic (CardGame.js's
// matchItem) rather than the simple itemTable used by GAMES, so its phrases
// are enumerated here by mirroring those response templates directly.
function buildCardPhraseList() {
  const phrases = new Set()

  for (const v of CARD_QUESTION_VARIANTS) phrases.add(v)
  phrases.add(CARD_TRY_AGAIN)
  phrases.add(getHelpText('Card'))
  phrases.add(getTipText('Card'))
  phrases.add(getAdvanceHint('Card'))
  phrases.add(getFirstQuestion('Card'))
  phrases.add(getBriefIntro('Card'))
  phrases.add(getLongIntroNoName('Card'))

  const allCards = []
  for (const suit of CARD_SUITS) for (const rank of CARD_RANKS) allCards.push({ rank, suit })
  for (const joker of CARD_COLORS) allCards.push({ joker })

  // Full-reveal sentences, and the noun phrases spoken via CORRECT_RESPONSES
  // when a full guess (rank + suit, or joker + colour) is correct
  for (const card of allCards) {
    phrases.add(getFullCardText(card))
    const display = getCardDisplayPhrase(card)
    for (const fn of CORRECT_RESPONSES) phrases.add(fn(null, display))
  }

  // Attribute-question reveals ("What's the suit/rank/colour?") — plain "It's X!"
  for (const color of CARD_COLORS) phrases.add(`It's ${color}!`)
  for (const suit of CARD_SUITS) phrases.add(`It's ${suit}!`)
  for (const rank of CARD_RANKS) phrases.add(`It's ${CARD_RANK_DISPLAY[rank]}!`)

  // Guess-confirmation reveals ("It is X!"), each with an emphasised "It IS X!"
  // counterpart spoken when the player phrases their guess as "is it...?"
  // (the `c()` rewrite in matchItem)
  const addBoth = (s) => { phrases.add(s); phrases.add(s.replace(/^It is\b/, 'It IS')) }

  addBoth('It is a joker!')
  for (const color of CARD_COLORS) {
    addBoth(`It is ${color}!`)
    addBoth(`It is a ${color} card!`)
    for (const suit of CARD_SUITS) addBoth(`It is a ${color} ${suit}!`)
    for (const rank of CARD_RANKS) addBoth(`It is the ${color} ${rank}!`)
  }
  for (const rank of CARD_RANKS) addBoth(`It is ${CARD_RANK_DISPLAY[rank]}!`)
  for (const suit of CARD_SUITS) addBoth(`It is ${suit}!`)

  return [...phrases]
}

export const VOICES = [
  'alloy', 'ash', 'ballad', 'coral', 'echo',
  'fable', 'nova', 'onyx', 'sage', 'shimmer',
]

export function buildPhraseList() {
  const phrases = new Set()

  // Shared responses (not game-specific)
  for (const r of TRY_AGAIN_RESPONSES) phrases.add(r)
  for (const r of CONFIRM_ONLY_RESPONSES) phrases.add(r)
  for (const fn of OUTRO_RESPONSES) phrases.add(fn(null))
  phrases.add(TIMEOUT_MESSAGE)
  phrases.add(TRANSCRIPTION_ERROR_MESSAGE)

  // Card game — bespoke phrase set (see buildCardPhraseList)
  for (const p of buildCardPhraseList()) phrases.add(p)

  // Per-game phrases
  for (const { gameType, itemTable, questionVariants, getDisplayItem, getRevealText } of GAMES) {
    const items = Object.keys(itemTable)

    // All correct response × item combinations
    for (const fn of CORRECT_RESPONSES) {
      for (const item of items) {
        phrases.add(fn(item, getDisplayItem(item)))
      }
    }

    // Question variants
    for (const v of questionVariants) phrases.add(v)

    // Reveal phrases ("It's red", "It's a circle.", etc.)
    for (const item of items) phrases.add(getRevealText(item))

    // Game-specific utility phrases
    phrases.add(getHelpText(gameType))
    phrases.add(getTipText(gameType))
    phrases.add(getAdvanceHint(gameType))
    phrases.add(getFirstQuestion(gameType))
    phrases.add(getBriefIntro(gameType))
    phrases.add(getLongIntroNoName(gameType))
  }

  return [...phrases]
}
