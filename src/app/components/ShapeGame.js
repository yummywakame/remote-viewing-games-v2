'use client'

import React, { useCallback, useState, useEffect, memo, useRef } from 'react'
import BaseGame from './BaseGame'
import ShapeGameSettings from './ShapeGameSettings'
import { Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import { sanitizeInput, getArticle } from '@/utils/gameUtils'

const itemTable = {
  triangle: '/shapes/triangle.svg',
  square: '/shapes/square.svg',
  circle: '/shapes/circle.svg',
  oval: '/shapes/oval.svg',
  diamond: '/shapes/diamond.svg',
  star: '/shapes/star.svg',
}

const ShapeGame = memo(function ShapeGame({ onGameStateChange = () => {} }) {
  const [selectedItems, setSelectedItems] = useState(Object.keys(itemTable))
  const [isIntroComplete, setIsIntroComplete] = useState(false)
  const [longIntroEnabled, setLongIntroEnabled] = useState(false)
  const [userName, setUserName] = useState('')
  const [voiceSpeed, setVoiceSpeed] = useState(1.2)
  const [voiceName, setVoiceName] = useState('echo')
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

    const savedLongIntro = localStorage.getItem('gameLongIntro')
    setLongIntroEnabled(savedLongIntro !== 'false')

    setUserName(sanitizeInput(localStorage.getItem('userPreferencesName') || ''))
    setVoiceSpeed(parseFloat(localStorage.getItem('userPreferencesVoiceSpeed')) || 1.2)
    setVoiceName(localStorage.getItem('userPreferencesVoiceName') || 'echo')
  }, [])

  // Sync preferences when updated from the header while on the game page
  useEffect(() => {
    const sync = () => {
      setUserName(sanitizeInput(localStorage.getItem('userPreferencesName') || ''))
      setVoiceSpeed(parseFloat(localStorage.getItem('userPreferencesVoiceSpeed')) || 1.2)
      setVoiceName(localStorage.getItem('userPreferencesVoiceName') || 'echo')
      setLongIntroEnabled(localStorage.getItem('gameLongIntro') !== 'false')
    }
    window.addEventListener('preferencesUpdated', sync)
    return () => window.removeEventListener('preferencesUpdated', sync)
  }, [])

  const updateCurrentItem = useCallback((newItem) => {
    currentItemRef.current = newItem
    setCurrentItem(newItem)
  }, [])

  const selectNewItem = useCallback((items) => {
    if (!items?.length) return null
    return items[Math.floor(Math.random() * items.length)]
  }, [])

  // handleVoiceCommand receives (command, speak) from BaseGame
  const handleVoiceCommand = useCallback((command, speak) => {
    const currentItem = currentItemRef.current

    if (/\b(what|which)(?:\s+(?:shape|is|it))?/.test(command)) {
      if (currentItem) {
        const article = getArticle(currentItem)
        speak(`It's ${article} ${currentItem}.`)
      }
      return currentItem || true
    }

    const showMatch = command.match(/\b(?:show(?:\s+me)?)\s+(?:a\s+|an\s+)?(.+)\b/i)
    if (showMatch) {
      const requested = showMatch[1].trim().replace(/^(a|an)\s+/, '')
      if (Object.prototype.hasOwnProperty.call(itemTable, requested)) {
        const article = getArticle(requested)
        speak(`Showing ${article} ${requested}.`)
        updateCurrentItem(requested)
      } else {
        const article = getArticle(requested)
        speak(`Sorry, ${article} ${requested} is not in my shape list.`)
      }
      return requested
    }

    const itemGuess = Object.keys(itemTable).find((item) => command.includes(item))
    if (itemGuess) {
      if (itemGuess === currentItem) {
        const article = getArticle(currentItem)
        speak(`Well done! It's ${article} ${currentItem}.`)
      } else {
        speak('Try again!')
      }
      return itemGuess
    }
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
            {sanitizeInput(gameType)} Game
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
    localStorage.setItem('gameLongIntro', sanitizeInput(String(longIntroEnabled)))
  }, [longIntroEnabled])

  const handleUpdateUserPreferences = useCallback((newName, newVoiceSpeed, newVoiceName) => {
    setUserName(newName)
    setVoiceSpeed(newVoiceSpeed)
    setVoiceName(newVoiceName)
    localStorage.setItem('userPreferencesName', sanitizeInput(newName))
    localStorage.setItem('userPreferencesVoiceSpeed', sanitizeInput(newVoiceSpeed.toString()))
    localStorage.setItem('userPreferencesVoiceName', sanitizeInput(newVoiceName))
  }, [])

  return (
    <BaseGame
      GameSettings={(props) => (
        <ShapeGameSettings
          {...props}
          selectedItems={selectedItems}
          onSave={handleSaveSettings}
          longIntroEnabled={longIntroEnabled}
          setLongIntroEnabled={setLongIntroEnabled}
        />
      )}
      gameType="Shape"
      onGameStateChange={onGameStateChange}
      renderGameContent={renderGameContent}
      handleVoiceCommand={handleVoiceCommand}
      selectNewItemProp={selectNewItem}
      itemTable={itemTable}
      longIntroEnabled={longIntroEnabled}
      selectedItems={selectedItems}
      onSaveSettings={handleSaveSettings}
      currentItem={currentItem}
      isIntroComplete={isIntroComplete}
      setIsIntroComplete={setIsIntroComplete}
      backgroundMode="dark"
      userName={userName}
      voiceSpeed={voiceSpeed}
      voiceName={voiceName}
      onUpdateUserPreferences={handleUpdateUserPreferences}
      onCurrentItemUpdate={updateCurrentItem}
    />
  )
})

export default ShapeGame
