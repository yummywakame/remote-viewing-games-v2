'use client'

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Settings, Mic, MicOff, Eye } from 'lucide-react'
import GameSettings from './GameSettings'
import { useRouter } from 'next/navigation'
import FloatingBubble from './FloatingBubble'
import Link from 'next/link'
import useGameLogic from '../hooks/useGameLogic'

export default function GameComponent({ 
  gameType, 
  title, 
  description, 
  renderGameContent,
  handleSpecificCommand,
  getNextItem,
  checkGuess
}) {
  const router = useRouter()
  const {
    gameState,
    setGameState,
    currentItem,
    setCurrentItem,
    isListening,
    isSpeaking,
    lastHeardWord,
    startGame,
    endGame,
    handleVoiceCommand,
    speak,
    startListening,
    stopListening
  } = useGameLogic(gameType, handleSpecificCommand, getNextItem, checkGuess)

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleBackgroundClick = useCallback((e) => {
    if (gameState === 'playing' &&
      !e.target.closest('button') &&
      !e.target.closest('.top-menu')) {
      getNextItem()
    }
  }, [gameState, getNextItem])

  const handleSaveSettings = () => {
    console.log(`Saving ${gameType} settings`)
  }

  return (
    <div className="relative h-screen overflow-auto">
      <div className="fixed top-0 left-0 right-0 bg-gray-800/80 backdrop-blur-sm z-10 top-menu">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              className="text-white hover:animate-spin-slow transition-all duration-300"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings size={24} />
            </button>
            <Link href="/" className="text-white text-xl font-bold absolute left-1/2 transform -translate-x-1/2">
              MindSight Games
            </Link>
            <div className="flex items-center space-x-4">
              {isListening && !isSpeaking ? (
                <Mic className="text-green-500" size={24} />
              ) : (
                <MicOff className="text-red-500" size={24} />
              )}
            </div>
          </div>
        </div>
      </div>
      <div
        className="fixed inset-0 pt-16"
        onClick={handleBackgroundClick}
      >
        <div className="flex items-center justify-center h-full">
          <div className="game-content text-center">
            {gameState === 'initial' && (
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
                  {title}
                </motion.h2>
                <motion.p 
                  className="game-description text-white mb-8"
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 120 }}
                >
                  {description}
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
            )}
            {(gameState === 'intro' || gameState === 'playing') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {gameState === 'intro' && (
                  <motion.p 
                    className="game-description text-white mb-8"
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
                  >
                    Game is starting...
                  </motion.p>
                )}
                <motion.button
                  onClick={endGame}
                  className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Stop Game
                </motion.button>
              </motion.div>
            )}
            {renderGameContent && renderGameContent(currentItem, gameState)}
          </div>
        </div>
      </div>
      {isSettingsOpen && (
        <GameSettings
          title={`${title} Settings`}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
        >
          <div>
            <p>{gameType} specific settings go here</p>
          </div>
        </GameSettings>
      )}
      {gameState !== 'initial' && (
        <FloatingBubble word={lastHeardWord} />
      )}
      {gameState === 'initial' && (
        <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div>
      )}
    </div>
  )
}