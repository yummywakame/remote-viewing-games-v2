'use client'

import React, { useCallback } from 'react'
import BaseGame from './BaseGame'
import GameSettings from './GameSettings'
import { Eye } from 'lucide-react'
import { motion } from 'framer-motion'

const colorTable = {
  yellow: '#FFD700',
  green: '#008000',
  blue: '#1E90FF',
  purple: '#6A5ACD',
  pink: '#FF00FF',
  red: '#DC143C',
  orange: '#FF7F50',
}

export default function ColorGame({ onGameStateChange = () => {} }) {
  const handleVoiceCommand = useCallback((command, currentColor, speak, selectNewColor, endGame) => {
    console.log('Voice command received:', command, 'Current color:', currentColor)
    const lowerCommand = command.toLowerCase()
    
    if (/\b(next|skip|forward)\b/.test(lowerCommand)) {
      console.log('Next command detected')
      const newColor = selectNewColor()
      console.log('New color after next command:', newColor)
      return newColor
    } else if (/\b(stop|end|quit|exit)\b/.test(lowerCommand)) {
      console.log('Stop command detected')
      endGame()
    } else if (/\b(help|instructions)\b/.test(lowerCommand)) {
      console.log('Help requested')
      speak("To proceed to the next color say 'next', or click anywhere on the screen. To end the game say 'stop'. For a hint you can ask 'what color is it?'. To display any color say 'show me', followed by the color you want to see.")
    } else if (/\b(what|which)(?:\s+(?:color|is|it))?\b/.test(lowerCommand)) {
      console.log('Color hint requested for color:', currentColor)
      speak(`The current color is ${currentColor}.`)
    } else if (/\b(show(?:\s+me)?)\s+(\w+)\b/.test(lowerCommand)) {
      const match = lowerCommand.match(/\b(show(?:\s+me)?)\s+(\w+)\b/)
      const requestedColor = match[2]
      console.log('Show color requested:', requestedColor)
      if (colorTable.hasOwnProperty(requestedColor)) {
        speak(`Showing ${requestedColor}.`)
        return requestedColor
      } else {
        speak(`Sorry, ${requestedColor} is not in my color list.`)
      }
    } else {
      const colorGuess = Object.keys(colorTable).find(color => lowerCommand.includes(color))
      if (colorGuess) {
        console.log('Color guess:', colorGuess, 'Current color:', currentColor)
        if (colorGuess === currentColor) {
          speak(`Well done! The color is ${currentColor}.`)
        } else {
          speak("Try again!")
        }
      } else {
        console.log('No valid command or color guess detected')
      }
    }
    return null
  }, [])

  const selectNewColor = useCallback((selectedColors, currentColor, setCurrentColor) => {
    console.log('Selecting new color. Current color:', currentColor)
    let newColor
    do {
      newColor = selectedColors[Math.floor(Math.random() * selectedColors.length)]
    } while (newColor === currentColor && selectedColors.length > 1)
    
    console.log('New color selected:', newColor)
    setCurrentColor(newColor)
    return newColor
  }, [])

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
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
          >
            {gameType} Game
          </motion.h2>
          <motion.p 
            className="game-description text-white mb-8"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 120 }}
          >
            Get your blindfold ready and let&apos;s begin!
          </motion.p>
          <motion.button
            onClick={startGame}
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
          animate={{ 
            opacity: 1, 
            y: isButtonAnimated ? '30vh' : 0
          }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
        >
          <motion.button
            onClick={endGame}
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Stop Game
          </motion.button>
        </motion.div>
      )
    }

    return null
  }, [])

  return (
    <BaseGame
      GameSettings={GameSettings}
      gameType="Color"
      onGameStateChange={onGameStateChange}
      renderGameContent={renderGameContent}
      handleVoiceCommand={handleVoiceCommand}
      selectNewItem={selectNewColor}
      colorTable={colorTable}
    />
  )
}