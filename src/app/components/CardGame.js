'use client'

import React, { useState, useCallback, useEffect, useRef, memo } from 'react'
import BaseGame from './BaseGame'
import CardDisplay from './CardDisplay'
import CardGameSettings from './CardGameSettings'
import { CARD_QUESTION_VARIANTS, CARD_TRY_AGAIN } from '@/lib/gameConstants'

const SUITS = ['spades', 'hearts', 'diamonds', 'clubs']
const RANKS = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king']
const RED_SUITS = ['hearts', 'diamonds']

const RANK_DISPLAY = {
  ace: 'an ace', '2': 'a two', '3': 'a three', '4': 'a four', '5': 'a five',
  '6': 'a six', '7': 'a seven', '8': 'an eight', '9': 'a nine', '10': 'a ten',
  jack: 'a jack', queen: 'a queen', king: 'a king',
}

const RANK_WORDS = {
  ace: 'ace', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  jack: 'jack', queen: 'queen', king: 'king',
}
const RANK_ALIASES = {
  ace: ['aces'],
  jack: ['jacks', 'jak'],
  queen: ['queens', 'keen'],
  king: ['kings'],
  '10': ['ten'],
}

const SUIT_WORDS = { spades: 'spades', hearts: 'hearts', diamonds: 'diamonds', clubs: 'clubs' }
const SUIT_ALIASES = {
  spades: ['spade'],
  hearts: ['heart'],
  diamonds: ['diamond'],
  clubs: ['club', 'gloves'],
}

function extractRank(transcript) {
  for (const [word, rank] of Object.entries(RANK_WORDS)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(transcript)) return rank
  }
  for (const [rank, aliases] of Object.entries(RANK_ALIASES)) {
    if (aliases.some(a => new RegExp(`\\b${a}\\b`, 'i').test(transcript))) return rank
  }
  return null
}

function extractSuit(transcript) {
  for (const [word, suit] of Object.entries(SUIT_WORDS)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(transcript)) return suit
  }
  for (const [suit, aliases] of Object.entries(SUIT_ALIASES)) {
    if (aliases.some(a => new RegExp(`\\b${a}\\b`, 'i').test(transcript))) return suit
  }
  return null
}

function extractColor(transcript) {
  if (/\bred\b/i.test(transcript)) return 'red'
  if (/\bblack\b/i.test(transcript)) return 'black'
  return null
}

function cardKey(card) {
  if (card.joker) return `${card.joker}_joker`
  return `${card.rank}_of_${card.suit}`
}

function fullCardText(card) {
  if (card.joker) return `It's the ${card.joker} joker!`
  return `It's ${RANK_DISPLAY[card.rank]} of ${card.suit}!`
}

function parseCardKey(key) {
  if (key === 'red_joker') return { joker: 'red' }
  if (key === 'black_joker') return { joker: 'black' }
  const parts = key.split('_of_')
  return { rank: parts[0], suit: parts[1] }
}

function buildDeck(ranks, suits, jokersEnabled) {
  const cards = []
  for (const suit of suits) {
    for (const rank of ranks) {
      cards.push(`${rank}_of_${suit}`)
    }
  }
  if (jokersEnabled) {
    cards.push('red_joker', 'black_joker')
  }
  return cards
}

const CardGame = memo(function CardGame({ onGameStateChange = () => {} }) {
  const [currentCard, setCurrentCard] = useState(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [selectedRanks, setSelectedRanks] = useState(RANKS)
  const [selectedSuits, setSelectedSuits] = useState(SUITS)
  const [jokersEnabled, setJokersEnabled] = useState(false)

  const currentCardRef = useRef(null)
  const isFlippedRef = useRef(false)

  useEffect(() => { isFlippedRef.current = isFlipped }, [isFlipped])

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedRanks = localStorage.getItem('cardGameSelectedRanks')
    if (savedRanks) {
      try {
        const parsed = JSON.parse(savedRanks)
        const valid = parsed.filter(r => RANKS.includes(r))
        if (valid.length >= 2) setSelectedRanks(valid)
      } catch { /* use default */ }
    }
    const savedSuits = localStorage.getItem('cardGameSelectedSuits')
    if (savedSuits) {
      try {
        const parsed = JSON.parse(savedSuits)
        const valid = parsed.filter(s => SUITS.includes(s))
        if (valid.length >= 1) setSelectedSuits(valid)
      } catch { /* use default */ }
    }
    setJokersEnabled(localStorage.getItem('cardGameJokersEnabled') === 'true')
  }, [])

  const selectedItems = buildDeck(selectedRanks, selectedSuits, jokersEnabled)

  // itemTable: flat map of cardKey → null (no color backgrounds)
  const itemTable = Object.fromEntries(selectedItems.map(k => [k, null]))

  const updateCurrentItem = useCallback((newKey) => {
    if (!newKey) {
      setCurrentCard(null)
      currentCardRef.current = null
      setIsFlipped(false)
      return
    }
    const parsed = parseCardKey(newKey)
    if (isFlippedRef.current) {
      // Card was revealed — flip to back, swap content at the midpoint (card is edge-on)
      setIsFlipped(false)
      setTimeout(() => {
        setCurrentCard(parsed)
        currentCardRef.current = parsed
      }, 200)
    } else {
      // Card was already obscured — silently swap, no animation
      setCurrentCard(parsed)
      currentCardRef.current = parsed
    }
  }, [])

  const selectNewItem = useCallback((items, currentKey) => {
    if (!items?.length) return null
    const pool = items.filter(k => k !== currentKey)
    if (!pool.length) return items[0]
    return pool[Math.floor(Math.random() * pool.length)]
  }, [])

  const matchItem = useCallback((transcript, speak) => {
    const card = currentCardRef.current
    if (!card) return null

    // Reveal commands
    if (/\b(what|which|reveal|show)\b/.test(transcript)) {
      setIsFlipped(true)
      return { item: cardKey(card), isCorrect: null, revealText: fullCardText(card) }
    }

    // Joker card
    if (card.joker) {
      if (/\bjoker\b/.test(transcript)) {
        return { item: cardKey(card), isCorrect: true, displayItem: 'a joker' }
      }
      const color = extractColor(transcript)
      if (color) {
        return color === card.joker
          ? { item: color, isCorrect: 'partial', revealText: `It is ${color}!` }
          : { item: color, isCorrect: false, tryAgainText: CARD_TRY_AGAIN }
      }
      return { item: cardKey(card), isCorrect: false, tryAgainText: CARD_TRY_AGAIN }
    }

    // Standard card
    const guessedRank = extractRank(transcript)
    const guessedSuit = extractSuit(transcript)
    const guessedColor = extractColor(transcript)

    // Full guess: rank + suit
    if (guessedRank && guessedSuit) {
      if (guessedRank === card.rank && guessedSuit === card.suit) {
        setIsFlipped(true)
        return { item: cardKey(card), isCorrect: true, displayItem: fullCardText(card) }
      }
      if (guessedRank === card.rank)
        return { item: guessedRank, isCorrect: 'partial', revealText: `It is ${RANK_DISPLAY[card.rank]}!` }
      if (guessedSuit === card.suit)
        return { item: guessedSuit, isCorrect: 'partial', revealText: `It is ${card.suit}!` }
      return { item: `${guessedRank} ${guessedSuit}`, isCorrect: false, tryAgainText: CARD_TRY_AGAIN }
    }

    // Rank only
    if (guessedRank) {
      return guessedRank === card.rank
        ? { item: guessedRank, isCorrect: 'partial', revealText: `It is ${RANK_DISPLAY[card.rank]}!` }
        : { item: guessedRank, isCorrect: false, tryAgainText: CARD_TRY_AGAIN }
    }

    // Suit only
    if (guessedSuit) {
      return guessedSuit === card.suit
        ? { item: guessedSuit, isCorrect: 'partial', revealText: `It is ${card.suit}!` }
        : { item: guessedSuit, isCorrect: false, tryAgainText: CARD_TRY_AGAIN }
    }

    // Colour only
    if (guessedColor) {
      const cardColor = RED_SUITS.includes(card.suit) ? 'red' : 'black'
      return guessedColor === cardColor
        ? { item: guessedColor, isCorrect: 'partial', revealText: `It is ${guessedColor}!` }
        : { item: guessedColor, isCorrect: false, tryAgainText: CARD_TRY_AGAIN }
    }

    return null
  }, [])

  const handleSaveSettings = useCallback((newRanks, newSuits, newJokersEnabled) => {
    setSelectedRanks(newRanks)
    setSelectedSuits(newSuits)
    setJokersEnabled(newJokersEnabled)
    localStorage.setItem('cardGameSelectedRanks', JSON.stringify(newRanks))
    localStorage.setItem('cardGameSelectedSuits', JSON.stringify(newSuits))
    localStorage.setItem('cardGameJokersEnabled', String(newJokersEnabled))
  }, [])

  const handleScreenTap = useCallback(({ goNext, speak }) => {
    if (isFlippedRef.current) {
      // Card already revealed — advance
      goNext()
    } else if (currentCardRef.current) {
      // Card obscured — reveal it
      setIsFlipped(true)
      isFlippedRef.current = true
      speak(fullCardText(currentCardRef.current))
    }
  }, [])

  return (
    <BaseGame
      GameSettings={(props) => (
        <CardGameSettings
          {...props}
          selectedRanks={selectedRanks}
          selectedSuits={selectedSuits}
          jokersEnabled={jokersEnabled}
          onSave={handleSaveSettings}
        />
      )}
      gameType="Card"
      accentColor="from-red-600 to-yellow-500"
      onGameStateChange={onGameStateChange}
      matchItem={matchItem}
      selectNewItemProp={selectNewItem}
      itemTable={itemTable}
      selectedItems={selectedItems}
      onSaveSettings={handleSaveSettings}
      questionVariants={CARD_QUESTION_VARIANTS}
      currentItem={currentCard ? cardKey(currentCard) : null}
      onCurrentItemUpdate={updateCurrentItem}
      onScreenTap={handleScreenTap}
      gameDisplayProps={{ cardDisplay: currentCard ? <CardDisplay card={currentCard} isFlipped={isFlipped} /> : null }}
    />
  )
})

export default CardGame
