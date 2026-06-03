'use client'

import React, { useCallback, useState, useEffect, memo } from 'react'
import BaseGame from './BaseGame'
import ColorGameSettings from './ColorGameSettings'

const itemTable = {
  yellow: '#FFD700',
  green: '#008000',
  blue: '#1E90FF',
  purple: '#6A5ACD',
  pink: '#FF00FF',
  red: '#DC143C',
  orange: '#FF7F50',
}

const COLOR_ALIASES = {
  red:    ['raid', 'reed', 'read', 'rad', 'bread', 'rick', 'great'],
  yellow: ['gielo', 'jello'],
  purple: ['pebble', 'pebbles'],
  orange: ['french'],
  blue:   ['okay', 'play'],
}

const matchesAlias = (command, color) =>
  COLOR_ALIASES[color]?.some(alias => new RegExp(`\\b${alias}\\b`).test(command))

const QUESTION_VARIANTS = [
  'What color is this?',
  'Next. What color do you see?',
  'Next. Can you tell what color this is?',
  'Next. What about this one?',
  'Next. And this one?',
  'Next. How about this one?',
  'Next. What do you sense?',
]

const ColorGame = memo(function ColorGame({ onGameStateChange = () => {} }) {
  const [selectedItems, setSelectedItems] = useState(['yellow', 'green', 'blue', 'purple', 'pink', 'red', 'orange'])
  const [currentItem, setCurrentItem] = useState(null)
  const currentItemRef = React.useRef(null)

  useEffect(() => {
    const savedItems = localStorage.getItem('colorGameSelectedItems')
    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems)
        if (Array.isArray(parsed) && parsed.length >= 2) setSelectedItems(parsed)
      } catch { /* ignore */ }
    }
  }, [])

  const updateCurrentItem = useCallback((newItem) => {
    currentItemRef.current = newItem
    setCurrentItem(newItem)
    if (newItem && itemTable[newItem]) {
      document.body.style.backgroundColor = itemTable[newItem]
    }
    if (!newItem) {
      document.body.style.backgroundColor = ''
    }
  }, [])

  // Keep currentItemRef in sync with state
  useEffect(() => {
    if (currentItem) currentItemRef.current = currentItem
  }, [currentItem])

  // matchItem receives (command, speak) from BaseGame; returns {item, isCorrect} or null
  const matchItem = useCallback((command, speak) => {
    // Collect ALL color words mentioned — handles "is it blue or green?" correctly
    const mentionedSelected = selectedItems.filter((c) => command.includes(c) || matchesAlias(command, c))
    const anyKnownColor = !mentionedSelected.length && Object.keys(itemTable).find(
      (c) => command.includes(c) || matchesAlias(command, c)
    )

    if (mentionedSelected.length > 0) {
      const currentColor = currentItemRef.current
      const isCorrect = !!(currentColor && mentionedSelected.includes(currentColor))
      return { item: isCorrect ? currentColor : mentionedSelected[0], isCorrect }
    }

    if (anyKnownColor) {
      return { item: anyKnownColor, isCorrect: false }
    }

    const showMatch = command.match(/show\s+(?:me\s+)?(?:the\s+)?(?:color\s+)?(\w+)/)
    if (showMatch) {
      const requested = showMatch[1]
      if (selectedItems.includes(requested)) {
        updateCurrentItem(requested)
        speak?.(`Showing you ${requested}`)
      } else {
        speak?.(`Sorry, ${requested} is not in the color list. Available colors are: ${selectedItems.join(', ')}`)
      }
      return { item: requested, isCorrect: null }
    }

    if (/\b(what|which)/.test(command)) {
      const current = currentItemRef.current
      if (current) speak?.(`It's ${current}`)
      return { item: current || 'hint', isCorrect: null }
    }

    return null
  }, [selectedItems, updateCurrentItem])

  const handleSaveSettings = useCallback((newSelectedItems) => {
    setSelectedItems(newSelectedItems)
    localStorage.setItem('colorGameSelectedItems', JSON.stringify(newSelectedItems))
  }, [])

  return (
    <BaseGame
      GameSettings={ColorGameSettings}
      gameType="Color"
      onGameStateChange={onGameStateChange}
      matchItem={matchItem}
      itemTable={itemTable}
      selectedItems={selectedItems}
      onSaveSettings={handleSaveSettings}
      questionVariants={QUESTION_VARIANTS}
      onCurrentItemUpdate={updateCurrentItem}
      currentItem={currentItem}
    />
  )
})

export default ColorGame
