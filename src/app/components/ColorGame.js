'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Eye, User } from 'lucide-react'
import GameSettings from './GameSettings'
import { useRouter } from 'next/navigation'
import FloatingBubble from './FloatingBubble'
import UserPreferences from './UserPreferences'

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
  const [gameState, setGameState] = useState('initial')
  const [currentColor, setCurrentColor] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastHeardWord, setLastHeardWord] = useState('')
  const [selectedColors, setSelectedColors] = useState(Object.keys(colorTable))
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isButtonAnimated, setIsButtonAnimated] = useState(false)
  const [userName, setUserName] = useState('')
  const [voiceSpeed, setVoiceSpeed] = useState(1.2)
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [isUserPreferencesOpen, setIsUserPreferencesOpen] = useState(false)

  const speechSynthesis = useRef(null)
  const recognition = useRef(null)
  const currentColorRef = useRef(null)
  const router = useRouter()

  const setAndLogGameState = useCallback((newState, action) => {
    setGameState(newState)
    onGameStateChange(newState)
    console.log(`Game state changed to ${newState} (${action})`)
    setIsButtonAnimated(newState === 'intro' || newState === 'playing')
  }, [onGameStateChange])

  const speak = useCallback((text) => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !speechSynthesis.current) {
        resolve()
        return
      }
      setIsSpeaking(true)
      const utterance = new SpeechSynthesisUtterance(text)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
      utterance.rate = voiceSpeed
      utterance.onend = () => {
        setIsSpeaking(false)
        resolve()
      }
      speechSynthesis.current.speak(utterance)
    })
  }, [selectedVoice, voiceSpeed])

  const startListening = useCallback(() => {
    if (!recognition.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognition.current = new SpeechRecognition()
      recognition.current.continuous = true
      recognition.current.interimResults = false
      recognition.current.lang = 'en-US'

      recognition.current.onresult = (event) => {
        const last = event.results.length - 1
        const transcript = event.results[last][0].transcript.trim().toLowerCase()
        setLastHeardWord(transcript)
        handleVoiceCommand(transcript)
      }

      recognition.current.onend = () => {
        if (gameState === 'playing' && !isSpeaking) {
          recognition.current.start()
        } else {
          setIsListening(false)
        }
      }
    }

    if (!isListening && !isSpeaking && gameState === 'playing') {
      recognition.current.start()
      setIsListening(true)
    }
  }, [gameState, isListening, isSpeaking])

  const stopListening = useCallback(() => {
    if (recognition.current) {
      recognition.current.stop()
    }
    setIsListening(false)
  }, [])

  const selectNewColor = useCallback(() => {
    let newColor
    do {
      newColor = selectedColors[Math.floor(Math.random() * selectedColors.length)]
    } while (newColor === currentColorRef.current && selectedColors.length > 1)
    
    currentColorRef.current = newColor
    setCurrentColor(newColor)
    return speak("What color is this?")
  }, [selectedColors, speak])

  const handleVoiceCommand = useCallback((command) => {
    if (/\b(next|skip|forward)\b/.test(command)) {
      selectNewColor()
    } else if (/\b(stop|end|quit|exit)\b/.test(command)) {
      endGame()
    } else if (/\b(help|instructions)\b/.test(command)) {
      speak("To proceed to the next color say 'next', or click anywhere on the screen. To end the game say 'stop'. For a hint you can ask 'what color is it?'. To display any color say 'show me', followed by the color you want to see.")
    } else if (/\b(what|which)(?:\s+(?:color|is|it))?\b/.test(command)) {
      speak(`The current color is ${currentColorRef.current}.`)
    } else if (/\b(show(?:\s+me)?)\s+(\w+)\b/.test(command)) {
      const [, , requestedColor] = command.match(/\b(show(?:\s+me)?)\s+(\w+)\b/)
      if (colorTable.hasOwnProperty(requestedColor)) {
        setCurrentColor(requestedColor)
        speak(`Showing ${requestedColor}.`)
      } else {
        speak(`Sorry, ${requestedColor} is not in my color list.`)
      }
    } else {
      const colorGuess = Object.keys(colorTable).find(color => command.includes(color))
      if (colorGuess) {
        if (colorGuess === currentColorRef.current) {
          speak(`Well done! The color is ${currentColorRef.current}.`)
        } else {
          speak("Try again!")
        }
      }
    }
  }, [selectNewColor, speak])

  const startGame = useCallback(async () => {
    setAndLogGameState('intro', 'start game')
    await speak(`Welcome to the Color Game ${userName || ''}! When prompted, say the color you think it is, or say 'help' at any time for further instructions. Good luck!`)
    setAndLogGameState('playing', 'game started')
    await selectNewColor()
    startListening()
  }, [setAndLogGameState, speak, selectNewColor, startListening, userName])


  const endGame = useCallback(async () => {
    stopListening()
    setAndLogGameState('initial', 'end game')
    setCurrentColor(null)
    setLastHeardWord('')
    await speak("Thank you for playing!")
    router.push('/')
  }, [stopListening, setAndLogGameState, speak, router])

  const handleBackgroundClick = useCallback(() => {
    if (gameState === 'playing' && !isSpeaking) {
      selectNewColor()
    }
  }, [gameState, isSpeaking, selectNewColor])

  const handleSaveSettings = useCallback((newSelectedColors) => {
    setSelectedColors(newSelectedColors)
    localStorage.setItem('colorGameSelectedColors', JSON.stringify(newSelectedColors))
  }, [])

  useEffect(() => {
    const savedColors = localStorage.getItem('colorGameSelectedColors')
    if (savedColors) {
      try {
        const parsedColors = JSON.parse(savedColors)
        if (Array.isArray(parsedColors) && parsedColors.length >= 2) {
          setSelectedColors(parsedColors)
        }
      } catch (error) {
        console.error('Error parsing saved colors:', error)
      }
    }
  }, [])

  useEffect(() => {
    if (gameState === 'playing' && !isListening && !isSpeaking) {
      const timeoutId = setTimeout(startListening, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [gameState, isListening, isSpeaking, startListening])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechSynthesis.current = window.speechSynthesis
      const loadVoices = () => {
        const voices = speechSynthesis.current.getVoices()
        if (voices.length > 0) {
          const utterance = new SpeechSynthesisUtterance()
          utterance.voice = voices[0]
        }
      }
      loadVoices()
      speechSynthesis.current.onvoiceschanged = loadVoices
    }

    return () => {
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel()
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (recognition.current) {
        recognition.current.stop()
      }
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel()
      }
    }
  }, [])

  useEffect(() => {
    const savedName = localStorage.getItem('userPreferencesName') || ''
    const savedVoiceSpeed = parseFloat(localStorage.getItem('userPreferencesVoiceSpeed')) || 1.2
    const savedVoiceName = localStorage.getItem('userPreferencesVoiceName')
    
    setUserName(savedName)
    setVoiceSpeed(savedVoiceSpeed)

    if (savedVoiceName && speechSynthesis) {
      const voices = speechSynthesis.current.getVoices()
      const voice = voices.find(v => v.name === savedVoiceName)
      setSelectedVoice(voice || null)
    }
  }, [])

  const handleTitleClick = useCallback(async () => {
    if (gameState !== 'initial') {
      await endGame()
    } else {
      router.push('/')
    }
  }, [gameState, endGame, router])


  return (
    <div className="relative h-screen overflow-auto">
      <div className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsUserPreferencesOpen(true)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Open user preferences"
              >
                <User size={24} />
              </button>
              <motion.button
                onClick={() => setIsSettingsOpen(true)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Open game settings"
                initial={{ rotate: 0 }}
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                <Settings size={24} />
              </motion.button>
            </div>
            <button
              onClick={handleTitleClick}
              className="text-white text-xl font-bold hover:text-gray-300 transition-colors"
            >
              MindSight Games
            </button>
            <div className="flex items-center space-x-4">
              {isListening && !isSpeaking ? (
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              ) : (
                <div className="w-3 h-3 rounded-full bg-red-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="fixed inset-0 pt-16"
        style={{
          backgroundColor: gameState === 'playing' || gameState === 'intro' ? colorTable[currentColor] : 'transparent',
          transition: 'background-color 0.5s ease'
        }}
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
                  Color Game
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
            )}
            <AnimatePresence>
              {(gameState === 'intro' || gameState === 'playing') && (
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
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isSettingsOpen && (
          <GameSettings
            key="settings"
            title="Color Game"
            onClose={() => setIsSettingsOpen(false)}
            onSave={handleSaveSettings}
            colorTable={colorTable}
            selectedColors={selectedColors}
          />
        )}
      </AnimatePresence>
      {gameState !== 'initial' && (
        <FloatingBubble word={lastHeardWord} />
      )}
      <UserPreferences
        isOpen={isUserPreferencesOpen}
        onClose={() => setIsUserPreferencesOpen(false)}
      />      
    </div>
  )
}