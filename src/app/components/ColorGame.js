'use client'

import React, { useCallback, useState, useEffect, memo } from 'react'
import BaseGame from './BaseGame'
import ColorGameSettings from './ColorGameSettings'
import { Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import { sanitizeInput } from '@/utils/gameUtils'

const itemTable = {
  yellow: '#FFD700',
  green: '#008000',
  blue: '#1E90FF',
  purple: '#6A5ACD',
  pink: '#FF00FF',
  red: '#DC143C',
  orange: '#FF7F50',
}

const ColorGame = memo(function ColorGame({ onGameStateChange = () => {} }) {
  const [selectedItems, setSelectedItems] = useState(['yellow', 'green', 'blue', 'purple', 'pink', 'red', 'orange'])
  const [currentItem, setCurrentItem] = useState(null)
  const [longIntroEnabled, setLongIntroEnabled] = useState(true)
  const [isIntroComplete, setIsIntroComplete] = useState(false)
  const [userName, setUserName] = useState('')
  const [voiceSpeed, setVoiceSpeed] = useState(1.2)
  const [voiceName, setVoiceName] = useState('coral')
  const currentItemRef = React.useRef(null)

  useEffect(() => {
    const savedItems = localStorage.getItem('colorGameSelectedItems')
    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems)
        if (Array.isArray(parsed) && parsed.length >= 2) setSelectedItems(parsed)
      } catch { /* ignore */ }
    }

    const savedLongIntro = localStorage.getItem('gameLongIntro')
    setLongIntroEnabled(savedLongIntro !== 'false')

    setUserName(sanitizeInput(localStorage.getItem('userPreferencesName') || ''))
    setVoiceSpeed(parseFloat(localStorage.getItem('userPreferencesVoiceSpeed')) || 1.2)
    setVoiceName(localStorage.getItem('userPreferencesVoiceName') || 'coral')
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

  // Reset background when game is not playing
  useEffect(() => {
    if (!isIntroComplete) {
      document.body.style.backgroundColor = ''
      currentItemRef.current = null
      setCurrentItem(null)
    }
  }, [isIntroComplete])

  const selectNewItem = useCallback((items, current) => {
    if (!items?.length) return null
    let next
    do { next = items[Math.floor(Math.random() * items.length)] }
    while (next === current && items.length > 1)
    return next
  }, [])

  // handleVoiceCommand receives (command, speak) from BaseGame
  const handleVoiceCommand = useCallback((command, speak) => {
    const matchedColor = selectedItems.find((c) => command.includes(c))

    if (matchedColor) {
      const currentColor = currentItemRef.current
      const isCorrect = currentColor && matchedColor === currentColor

      if (isCorrect) {
        speak('Correct!').then(async () => {
          const newItem = selectNewItem(selectedItems, matchedColor)
          if (newItem) {
            updateCurrentItem(newItem)
            await speak(`What color is this?`)
          }
        })
      } else {
        speak('Try again')
      }
      return true
    }

    const showMatch = command.match(/show\s+(?:me\s+)?(?:the\s+)?(?:color\s+)?(\w+)/)
    if (showMatch) {
      const requested = showMatch[1]
      if (selectedItems.includes(requested)) {
        updateCurrentItem(requested)
        speak(`Showing you ${requested}`)
      } else {
        speak(`Sorry, ${requested} is not in the color list. Available colors are: ${selectedItems.join(', ')}`)
      }
      return true
    }

    if (/\b(what|which)/.test(command)) {
      const current = currentItemRef.current
      if (current) speak(`It's ${current}`)
      return true
    }
  }, [selectedItems, selectNewItem, updateCurrentItem])

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
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
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
            onClick={endGame}
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
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
    localStorage.setItem('colorGameSelectedItems', JSON.stringify(newSelectedItems))
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
      GameSettings={ColorGameSettings}
      gameType="Color"
      onGameStateChange={onGameStateChange}
      renderGameContent={renderGameContent}
      handleVoiceCommand={handleVoiceCommand}
      itemTable={itemTable}
      backgroundMode="color"
      isIntroComplete={isIntroComplete}
      setIsIntroComplete={setIsIntroComplete}
      selectedItems={selectedItems}
      onSaveSettings={handleSaveSettings}
      userName={userName}
      voiceSpeed={voiceSpeed}
      voiceName={voiceName}
      onUpdateUserPreferences={handleUpdateUserPreferences}
      selectNewItemProp={selectNewItem}
      onCurrentItemUpdate={updateCurrentItem}
      currentItem={currentItem}
    />
  )
})

export default ColorGame
