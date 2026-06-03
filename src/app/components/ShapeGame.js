'use client'

import React, { useCallback, useState, useEffect, memo, useRef } from 'react'
import BaseGame from './BaseGame'
import ShapeGameSettings from './ShapeGameSettings'
import { Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import { getArticle } from '@/utils/gameUtils'

const itemTable = {
  triangle: '/shapes/triangle.svg',
  square: '/shapes/square.svg',
  circle: '/shapes/circle.svg',
  oval: '/shapes/oval.svg',
  diamond: '/shapes/diamond.svg',
  star: '/shapes/star.svg',
}

const SHAPE_ALIASES = {
  triangle: ['try angle', 'trying', 'try angel', 'tri angle'],
  square:   ['scare', 'squire', 'swear', 'squared'],
  circle:   ['surgical', 'surreal', 'circles', 'circled'],
  oval:     ['over', 'opal', 'able', 'oh well'],
  diamond:  ['die man', 'diamonds', 'diemond'],
  star:     ['store', 'scar', 'stare', 'start', 'stars'],
}

const matchesAlias = (command, shape) =>
  SHAPE_ALIASES[shape]?.some(alias => new RegExp(`\\b${alias}\\b`).test(command))

const QUESTION_VARIANTS = [
  'What shape is this?',
  'Next. What shape do you see?',
  'Next. Can you tell what shape this is?',
  'Next. What about this one?',
  'Next. And this one?',
  'Next. How about this one?',
  'Next. What do you sense?',
]

const ShapeGame = memo(function ShapeGame({ onGameStateChange = () => {} }) {
  const [selectedItems, setSelectedItems] = useState(Object.keys(itemTable))
  const [isIntroComplete, setIsIntroComplete] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
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
      if (currentShape) {
        const article = getArticle(currentShape)
        speak?.(`It's ${article} ${currentShape}.`)
      }
      return { item: currentShape || 'hint', isCorrect: null }
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

  const renderGameContent = useCallback(({ gameState, startGame, endGame, isButtonAnimated, gameType }) => {
    if (gameState === 'initial') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h2
            className="game-title text-white text-5xl md:text-6xl font-bold mb-6"
            initial={{ y: -20 }} animate={{ y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
          >
            {gameType} Game
          </motion.h2>
          <motion.p
            className="game-description text-white mb-8"
            initial={{ y: 20 }} animate={{ y: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 120 }}
          >
            Get your blindfold ready and let&apos;s begin!
          </motion.p>
          <motion.button
            onClick={startGame}
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-green-500 text-white font-medium text-lg hover:from-blue-700 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            <Eye className="mr-2" size={20} />
            Start Game
          </motion.button>
        </motion.div>
      )
    }

    if (gameState === 'intro' || gameState === 'playing') {
      return (
        <motion.div
          key="game-button"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: isButtonAnimated ? '30vh' : 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
        >
          <motion.button
            onClick={() => endGame()}
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-green-500 text-white font-medium text-lg hover:from-blue-700 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          >
            Stop Game
          </motion.button>
        </motion.div>
      )
    }

    return null
  }, [])

  const handleSaveSettings = useCallback((newSelectedItems) => {
    setSelectedItems(newSelectedItems)
    localStorage.setItem('shapeGameSelectedItems', JSON.stringify(newSelectedItems))
  }, [])

  return (
    <BaseGame
      GameSettings={(props) => (
        <ShapeGameSettings
          {...props}
          selectedItems={selectedItems}
          onSave={handleSaveSettings}
        />
      )}
      gameType="Shape"
      onGameStateChange={onGameStateChange}
      renderGameContent={renderGameContent}
      matchItem={matchItem}
      selectNewItemProp={selectNewItem}
      itemTable={itemTable}
      selectedItems={selectedItems}
      onSaveSettings={handleSaveSettings}
      questionVariants={QUESTION_VARIANTS}
      currentItem={currentItem}
      isIntroComplete={isIntroComplete}
      setIsIntroComplete={setIsIntroComplete}
      onCurrentItemUpdate={updateCurrentItem}
    />
  )
})

export default ShapeGame
