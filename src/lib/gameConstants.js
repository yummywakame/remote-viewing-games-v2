// Single source of truth for all game phrases, item tables, and phrase builders.
// Imported by game components (browser) AND the audio generation script (Node.js).
// No JSX, no browser-only APIs — must stay plain ES module.

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export const getArticle = (word) =>
  ['a', 'e', 'i', 'o', 'u'].includes(word.toLowerCase()[0]) ? 'an' : 'a'

// ---------- Shared responses ----------

export const CORRECT_RESPONSES = [
  (item, display) => `Correct! It IS ${display ?? item}!`,
  (item, display) => `Yes, it's ${display ?? item}!`,
  (item, display) => `Well done! ${cap(display ?? item)}!`,
  (item, display) => `Yes, ${display ?? item}!`,
  (item, display) => `You nailed it! It's ${display ?? item}!`,
  (item, display) => `Yep, it's ${display ?? item}!`,
  (item, display) => `It IS ${display ?? item}!`,
  (item, display) => `${cap(display ?? item)} it is!`,
]

export const TRY_AGAIN_RESPONSES = [
  'Not this time — keep sensing!',
  'Almost! Give it another go.',
  "Not quite! Keep going, you've got this!",
  'Not quite — what else do you pick up?',
  'Give it another try!',
  "You're getting there — try again!",
]

export const OUTRO_RESPONSES = [
  (name) => name ? `Thanks ${name}! Let's practice again soon.` : 'Thank you for playing!',
  (name) => name ? `Thanks ${name}! I hope we play again soon.` : 'Great session — thanks for playing!',
  (name) => name ? `That was a good practice session, ${name}!` : 'That was a great practice session!',
]

export const TIMEOUT_MESSAGE = 'Goodbye!'

export const TRANSCRIPTION_ERROR_MESSAGE =
  "I'm sorry. I can't seem to hear you right now. Please check your internet connection and try again."

// ---------- Color game ----------

export const COLOR_ITEM_TABLE = {
  yellow: '#FFD700',
  green:  '#008000',
  blue:   '#1E90FF',
  purple: '#6A5ACD',
  pink:   '#FF00FF',
  red:    '#DC143C',
  orange: '#FF7F50',
}

export const COLOR_QUESTION_VARIANTS = [
  'Next. What color do you see?',
  'Next. Can you tell what color this is?',
  'Next. What about this one?',
  'Next. And this one?',
  'Next. How about this one?',
  'Next. What do you sense?',
  "Next. Howabout this color?",
]

export const getColorRevealText = (item) => `It's ${item}`

// ---------- Shape game ----------

export const SHAPE_ITEM_TABLE = {
  triangle: '/shapes/triangle.svg',
  square:   '/shapes/square.svg',
  circle:   '/shapes/circle.svg',
  oval:     '/shapes/oval.svg',
  diamond:  '/shapes/diamond.svg',
  star:     '/shapes/star.svg',
}

export const SHAPE_QUESTION_VARIANTS = [
  'Next. What shape do you see?',
  'Next. Can you tell what shape this is?',
  'Next. What about this one?',
  'Next. And this one?',
  'Next. How about this one?',
  'Next. What do you sense?',
  "Next. What's this shape?",
]

export const getShapeRevealText = (item) => `It's ${getArticle(item)} ${item}.`

// ---------- Number game ----------

export const NUMBER_ITEM_TABLE = {
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
  '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
}

export const NUMBER_QUESTION_VARIANTS = [
  'Next. What number do you see?',
  'Next. Can you tell what number this is?',
  'Next. What about this one?',
  'Next. And this one?',
  'Next. How about this one?',
  'Next. What do you sense?',
  "Next. What's this number?",
]

export const NUMBER_DISPLAY_WORDS = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
  '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
}

// 'one' is pronounced 'wun' so takes 'a' not 'an'; only 'eight' takes 'an'
export const NUMBER_ARTICLES = {
  '0': 'a', '1': 'a', '2': 'a', '3': 'a', '4': 'a',
  '5': 'a', '6': 'a', '7': 'a', '8': 'an', '9': 'a',
}

export const getNumberRevealText = (item) =>
  `It's ${NUMBER_ARTICLES[item] ?? 'a'} ${NUMBER_DISPLAY_WORDS[item] ?? item}.`

// ---------- Game-specific phrase builders ----------

export const getHelpText = (gameType) => {
  if (gameType === 'Card') {
    return "To proceed to the next card say 'next', or click anywhere on the screen. For a hint ask 'what card is it?' You can also say the suit, the rank, or the colour. To end the game at any time say 'stop' or 'end the game'."
  }
  return `To proceed to the next ${gameType.toLowerCase()} say 'next', or click anywhere on the screen. For a hint ask 'what ${gameType.toLowerCase()} is it?' To end the game at any time say 'stop' or 'end the game'.`
}

export const getTipText = (gameType) => {
  if (gameType === 'Card') return 'Try saying the suit, the rank, or the colour.'
  return `Sometimes I have trouble hearing single word answers. Try telling me the ${gameType.toLowerCase()} in a sentence.`
}

export const getAdvanceHint = (gameType) =>
  `Say 'next ${gameType.toLowerCase()}' or click the screen to advance when you're ready.`

export const getFirstQuestion = (gameType) => {
  if (gameType === 'Card') return 'What card do you sense?'
  return `What ${gameType.toLowerCase()} is this?`
}

export const getBriefIntro = (gameType) => {
  if (gameType === 'Card') return "Let's begin! I'll show you cards. Tell me the card, the suit, the rank, or the colour."
  return `Let's practice MindSight with ${gameType.toLowerCase()}s!`
}

export const getLongIntroNoName = (gameType) => {
  if (gameType === 'Card') return "Let's practice MindSight with cards! I'll show you cards from the deck and you tell me what you sense — the suit, the rank, the colour, or the full card. Say \"Help\" at any time for controls. Are you ready?"
  return `Let's practice MindSight with ${gameType.toLowerCase()}s! I'll show you different ${gameType.toLowerCase()}s, and you tell me what you sense. Say "Help" at any time for controls. Are you ready?`
}

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

// ---------- Game configs (used by audio generation script) ----------

export const GAMES = [
  {
    gameType: 'Color',
    itemTable: COLOR_ITEM_TABLE,
    questionVariants: COLOR_QUESTION_VARIANTS,
    getDisplayItem: (item) => item,
    getRevealText: getColorRevealText,
  },
  {
    gameType: 'Shape',
    itemTable: SHAPE_ITEM_TABLE,
    questionVariants: SHAPE_QUESTION_VARIANTS,
    getDisplayItem: (item) => `${getArticle(item)} ${item}`,
    getRevealText: getShapeRevealText,
  },
  {
    gameType: 'Number',
    itemTable: NUMBER_ITEM_TABLE,
    questionVariants: NUMBER_QUESTION_VARIANTS,
    getDisplayItem: (item) => `${NUMBER_ARTICLES[item] ?? 'a'} ${NUMBER_DISPLAY_WORDS[item] ?? item}`,
    getRevealText: getNumberRevealText,
  },
]
