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
  "Next. What's this color?",
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

// ---------- Game-specific phrase builders ----------

export const getHelpText = (gameType) =>
  `To proceed to the next ${gameType.toLowerCase()} say 'next', or click anywhere on the screen. To end the game say 'stop'. For a hint ask 'what ${gameType.toLowerCase()} is it?'`

export const getTipText = (gameType) =>
  `Sometimes I can't understand single word answers. Try telling me the ${gameType.toLowerCase()} in a sentence.`

export const getAdvanceHint = (gameType) =>
  `Say 'next ${gameType.toLowerCase()}' or click the screen to advance when you're ready.`

export const getFirstQuestion = (gameType) =>
  `What ${gameType.toLowerCase()} is this?`

export const getBriefIntro = (gameType) =>
  `Let's practice MindSight with ${gameType.toLowerCase()}s!`

export const getLongIntroNoName = (gameType) =>
  `Let's practice MindSight with ${gameType.toLowerCase()}s! I'll show you different ${gameType.toLowerCase()}s, and you tell me what you sense. Say "Help" at any time for controls. Are you ready?`

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
]
