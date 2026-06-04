'use client'

import React, { useCallback, useState, useEffect, memo } from 'react'
import BaseGame from './BaseGame'
import ColorGameSettings from './ColorGameSettings'
import { COLOR_ITEM_TABLE as itemTable, COLOR_QUESTION_VARIANTS as QUESTION_VARIANTS, getColorRevealText } from '@/lib/gameConstants'

const COLOR_ALIASES = {
  red:    ['raid', 'reed', 'read', 'rad', 'bread', 'rick', 'great', 'grade'],
  yellow: ['gielo', 'jello', 'hello'],
  purple: ['pebble', 'pebbles', 'triple', 'lavender', 'lander', 'circle'],
  pink:   ['magenta'],
  orange: ['french'],
  blue:   ['okay', 'play', 'view', 'lou'],
}

const matchesAlias = (command, color) =>
  COLOR_ALIASES[color]?.some(alias => new RegExp(`\\b${alias}\\b`).test(command))

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
      return { item: current || 'hint', isCorrect: null, revealText: current ? getColorRevealText(current) : null }
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
