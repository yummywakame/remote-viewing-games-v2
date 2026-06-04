'use client'

import React, { useCallback, useState, useEffect, memo, useRef } from 'react'
import BaseGame from './BaseGame'
import NumberGameSettings from './NumberGameSettings'
import { NUMBER_ITEM_TABLE as itemTable, NUMBER_QUESTION_VARIANTS as QUESTION_VARIANTS, getNumberRevealText, NUMBER_DISPLAY_WORDS, NUMBER_ARTICLES } from '@/lib/gameConstants'

const NUMBER_WORD_MAP = {
  zero: '0', one: '1', two: '2', three: '3', four: '4',
  five: '5', six: '6', seven: '7', eight: '8', nine: '9',
}

const NUMBER_ALIASES = {
  '0': ['oh', 'nought', 'naught'],   // 'note' excluded — conflicts with '9'
  '1': ['won', 'wan'],
  '2': ['too', 'tu'],
  '3': ['tree', 'free'],             // non-native / accent pronunciations
  '4': ['for', 'fore', 'fur'],
  '5': ['hive', 'fife'],             // rhyme/clipping mishearings
  '6': ['sex'],                      // Deepgram mishearing of 'six'
  '7': ['heaven'],                   // 'seven' with dropped 's'
  '8': ['ate', 'ait'],
  '9': ['nein', 'note'],             // 'note' confirmed in testing
}

const matchesAlias = (command, digit) =>
  NUMBER_ALIASES[digit]?.some(alias => new RegExp(`\\b${alias}\\b`).test(command))

const matchNumberInCommand = (command) => {
  for (const [word, digit] of Object.entries(NUMBER_WORD_MAP)) {
    if (new RegExp(`\\b${word}\\b`).test(command)) return digit
  }
  return Object.keys(itemTable).find(
    (digit) => new RegExp(`\\b${digit}\\b`).test(command) || matchesAlias(command, digit)
  ) ?? null
}

const NumberGame = memo(function NumberGame({ onGameStateChange = () => {} }) {
  const [selectedItems, setSelectedItems] = useState(Object.keys(itemTable))
  const [currentItem, setCurrentItem] = useState(null)
  const [lightMode, setLightMode] = useState(false)
  const currentItemRef = useRef(null)

  useEffect(() => {
    const savedItems = localStorage.getItem('numberGameSelectedItems')
    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems)
        const valid = parsed.filter((i) => Object.keys(itemTable).includes(i))
        if (valid.length >= 2) setSelectedItems(valid)
        else setSelectedItems(Object.keys(itemTable))
      } catch { setSelectedItems(Object.keys(itemTable)) }
    }
    setLightMode(localStorage.getItem('numberGameLightMode') === 'true')
  }, [])

  const updateCurrentItem = useCallback((newItem) => {
    currentItemRef.current = newItem
    setCurrentItem(newItem)
  }, [])

  const selectNewItem = useCallback((items) => {
    if (!items?.length) return null
    return items[Math.floor(Math.random() * items.length)]
  }, [])

  const matchItem = useCallback((command, speak) => {
    const currentNumber = currentItemRef.current

    if (/\b(what|which)(?:\s+(?:number|is|it))?/.test(command)) {
      const revealText = currentNumber ? getNumberRevealText(currentNumber) : null
      return { item: currentNumber || 'hint', isCorrect: null, revealText }
    }

    const showMatch = command.match(/\b(?:show(?:\s+me)?)\s+(?:a\s+|an\s+)?(.+)\b/i)
    if (showMatch) {
      const requested = showMatch[1].trim().replace(/^(a|an|number)\s+/, '')
      const requestedDigit =
        NUMBER_WORD_MAP[requested] ||
        (Object.prototype.hasOwnProperty.call(itemTable, requested) ? requested : null)
      if (requestedDigit) {
        speak?.(`Showing ${requested}.`)
        updateCurrentItem(requestedDigit)
      } else {
        speak?.(`Sorry, ${requested} is not in my number list.`)
      }
      return { item: requestedDigit || requested, isCorrect: null }
    }

    const itemGuess = matchNumberInCommand(command)
    if (itemGuess) {
      const isCorrect = itemGuess === currentNumber
      const word = NUMBER_DISPLAY_WORDS[itemGuess] ?? itemGuess
      const article = NUMBER_ARTICLES[itemGuess] ?? 'a'
      return { item: itemGuess, isCorrect, displayItem: `${article} ${word}` }
    }

    return null
  }, [updateCurrentItem])

  const handleSaveSettings = useCallback((newSelectedItems, newLightMode = false) => {
    setSelectedItems(newSelectedItems)
    localStorage.setItem('numberGameSelectedItems', JSON.stringify(newSelectedItems))
    setLightMode(newLightMode)
    localStorage.setItem('numberGameLightMode', String(newLightMode))
  }, [])

  return (
    <BaseGame
      GameSettings={(props) => (
        <NumberGameSettings
          {...props}
          selectedItems={selectedItems}
          onSave={handleSaveSettings}
          lightMode={lightMode}
        />
      )}
      gameType="Number"
      accentColor="from-green-600 to-orange-600"
      onGameStateChange={onGameStateChange}
      matchItem={matchItem}
      selectNewItemProp={selectNewItem}
      itemTable={itemTable}
      selectedItems={selectedItems}
      onSaveSettings={handleSaveSettings}
      questionVariants={QUESTION_VARIANTS}
      currentItem={currentItem}
      onCurrentItemUpdate={updateCurrentItem}
      gameDisplayProps={{ lightMode }}
    />
  )
})

export default NumberGame
