'use client'

import React, { useCallback, useState, useEffect, memo, useRef } from 'react'
import BaseGame from './BaseGame'
import ShapeGameSettings from './ShapeGameSettings'
import { SHAPE_ITEM_TABLE as itemTable, SHAPE_QUESTION_VARIANTS as QUESTION_VARIANTS, getShapeRevealText, getArticle } from '@/lib/gameConstants'

const SHAPE_ALIASES = {
  triangle: ['try angle', 'trying', 'try angel', 'tri angle'],
  square:   ['scare', 'squire', 'swear', 'squared'],
  circle:   ['surgical', 'surreal', 'circles', 'circled'],
  oval:     ['over', 'opal', 'able', 'oh well', 'hello'],
  diamond:  ['die man', 'diamonds', 'diemond'],
  star:     ['store', 'scar', 'stare', 'start', 'stars'],
}

const matchesAlias = (command, shape) =>
  SHAPE_ALIASES[shape]?.some(alias => new RegExp(`\\b${alias}\\b`).test(command))

const ShapeGame = memo(function ShapeGame({ onGameStateChange = () => {} }) {
  const [selectedItems, setSelectedItems] = useState(Object.keys(itemTable))
  const [currentItem, setCurrentItem] = useState(null)
  const [lightMode, setLightMode] = useState(false)
  const currentItemRef = useRef(null)

  useEffect(() => {
    const savedItems = localStorage.getItem('shapeGameSelectedItems')
    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems)
        const valid = parsed.filter((i) => Object.keys(itemTable).includes(i))
        if (valid.length >= 2) setSelectedItems(valid)
        else setSelectedItems(Object.keys(itemTable))
      } catch { setSelectedItems(Object.keys(itemTable)) }
    }
    setLightMode(localStorage.getItem('shapeGameLightMode') === 'true')
  }, [])

  const updateCurrentItem = useCallback((newItem) => {
    currentItemRef.current = newItem
    setCurrentItem(newItem)
  }, [])

  const selectNewItem = useCallback((items) => {
    if (!items?.length) return null
    return items[Math.floor(Math.random() * items.length)]
  }, [])

  // matchItem receives (command, speak) from BaseGame; returns {item, isCorrect, displayItem?} or null
  const matchItem = useCallback((command, speak) => {
    const currentShape = currentItemRef.current

    if (/\b(what|which)(?:\s+(?:shape|is|it))?/.test(command)) {
      const revealText = currentShape ? getShapeRevealText(currentShape) : null
      return { item: currentShape || 'hint', isCorrect: null, revealText }
    }

    const showMatch = command.match(/\b(?:show(?:\s+me)?)\s+(?:a\s+|an\s+)?(.+)\b/i)
    if (showMatch) {
      const requested = showMatch[1].trim().replace(/^(a|an)\s+/, '')
      if (Object.prototype.hasOwnProperty.call(itemTable, requested)) {
        const article = getArticle(requested)
        speak?.(`Showing ${article} ${requested}.`)
        updateCurrentItem(requested)
      } else {
        const article = getArticle(requested)
        speak?.(`Sorry, ${article} ${requested} is not in my shape list.`)
      }
      return { item: requested, isCorrect: null }
    }

    const itemGuess = Object.keys(itemTable).find(
      (item) => command.includes(item) || matchesAlias(command, item)
    )
    if (itemGuess) {
      const isCorrect = itemGuess === currentShape
      return { item: itemGuess, isCorrect, displayItem: `${getArticle(itemGuess)} ${itemGuess}` }
    }

    return null
  }, [updateCurrentItem])

  const handleSaveSettings = useCallback((newSelectedItems, newLightMode = false) => {
    setSelectedItems(newSelectedItems)
    localStorage.setItem('shapeGameSelectedItems', JSON.stringify(newSelectedItems))
    setLightMode(newLightMode)
    localStorage.setItem('shapeGameLightMode', String(newLightMode))
  }, [])

  return (
    <BaseGame
      GameSettings={(props) => (
        <ShapeGameSettings
          {...props}
          selectedItems={selectedItems}
          onSave={handleSaveSettings}
          lightMode={lightMode}
        />
      )}
      gameType="Shape"
      accentColor="from-blue-600 to-green-500"
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

export default ShapeGame
