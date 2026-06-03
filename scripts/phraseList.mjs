// Shared phrase list builder — used by both generate-audio.mjs and check-audio.mjs.
// Derives all pre-generable phrases directly from game constants, so edits to
// responses/items automatically flow through to the audio sync scripts.

import {
  CORRECT_RESPONSES, TRY_AGAIN_RESPONSES, OUTRO_RESPONSES, TIMEOUT_MESSAGE,
  GAMES,
  getHelpText, getTipText, getAdvanceHint, getFirstQuestion,
  getBriefIntro, getLongIntroNoName,
} from '../src/lib/gameConstants.js'

export const VOICES = [
  'alloy', 'ash', 'ballad', 'coral', 'echo',
  'fable', 'nova', 'onyx', 'sage', 'shimmer',
]

export function buildPhraseList() {
  const phrases = new Set()

  // Shared responses (not game-specific)
  for (const r of TRY_AGAIN_RESPONSES) phrases.add(r)
  for (const fn of OUTRO_RESPONSES) phrases.add(fn(null))
  phrases.add(TIMEOUT_MESSAGE)

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
