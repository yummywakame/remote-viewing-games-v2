'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Mic, MicOff, Eye } from 'lucide-react'
import GameSettings from './GameSettings'
import { useRouter } from 'next/navigation'
import FloatingBubble from './FloatingBubble'
import Link from 'next/link'

const colorTable = {
  yellow: '#FFD700',
  green: '#008000',
  blue: '#1E90FF',
  purple: '#6A5ACD',
  pink: '#FF00FF',
  red: '#DC143C',
  orange: '#FF7F50',
}

const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export default function ColorGame({ onGameStateChange = () => {} }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [gameState, setGameState] = useState('initial')
  const [currentColor, setCurrentColor] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [lastHeardWord, setLastHeardWord] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedColors, setSelectedColors] = useState(Object.keys(colorTable))
  const [isButtonAnimated, setIsButtonAnimated] = useState(false)
  const speechSynthesis = useRef(null)
  const speechUtterance = useRef(null)
  const recognition = useRef(null)
  const lastCommandTime = useRef(0)
  const restartTimeout = useRef(null)
  const router = useRouter()

  const setAndLogGameState = useCallback((newState, action) => {
    setGameState(newState)
    onGameStateChange(newState)
    console.log(`Game state changed to ${newState} (${action})`)
    if (newState === 'intro' || newState === 'playing') {
      setIsButtonAnimated(true)
    } else {
      setIsButtonAnimated(false)
    }
  }, [onGameStateChange])

  const cleanupRecognition = useCallback(() => {
    if (recognition.current) {
      recognition.current.onend = null
      recognition.current.onstart = null
      recognition.current.onerror = null
      recognition.current.onresult = null
      try {
        recognition.current.abort()
      } catch (error) {
        console.error('Error aborting recognition:', error)
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    if (restartTimeout.current) {
      clearTimeout(restartTimeout.current)
      restartTimeout.current = null
    }
    
    cleanupRecognition()
    setIsListening(false)
    console.log('Stopped listening')
  }, [cleanupRecognition])

  const speak = useCallback((text) => {
    return new Promise((resolve, reject) => {
      if (!speechSynthesis.current || !speechUtterance.current) {
        reject(new Error('Speech synthesis not initialized'))
        return
      }

      if (speechSynthesis.current.speaking) {
        speechSynthesis.current.cancel()
        setTimeout(() => {
          setupAndSpeak()
        }, 100)
      } else {
        setupAndSpeak()
      }

      function setupAndSpeak() {
        stopListening()
        setIsSpeaking(true)

        const utterance = new SpeechSynthesisUtterance('... ' + text)
        utterance.voice = speechUtterance.current.voice
        utterance.rate = 1.2
        utterance.pitch = 1.0

        utterance.onend = () => {
          console.log('Speech ended:', text)
          setIsSpeaking(false)
          resolve()

          if (text === "What color is this?") {
            setAndLogGameState('playing', 'after color prompt')
            setTimeout(() => startListening(), 500)
          } else if (gameState === 'playing' && text !== "Thank you for playing!") {
            setTimeout(() => startListening(), 500)
          }
        }

        utterance.onerror = (event) => {
          if (event.error === 'interrupted' || event.error === 'canceled') {
            console.log('Speech interrupted, continuing with game')
            setIsSpeaking(false)
            resolve()
            return
          }
          console.error('Speech synthesis error:', event)
          setIsSpeaking(false)
          reject(event)
        }

        setTimeout(() => {
          speechSynthesis.current.speak(utterance)
        }, 100)
      }
    })
  }, [stopListening, setAndLogGameState, gameState])

  const askForColor = useCallback(async () => {
    try {
      console.log('Speaking color prompt')
      await speak("What color is this?")
      console.log('Color prompt completed')
    } catch (error) {
      console.error('Error in askForColor:', error)
    }
  }, [speak])

  const selectNewColor = useCallback(async () => {
    let newColor
    do {
      newColor = selectedColors[Math.floor(Math.random() * selectedColors.length)]
    } while (newColor === currentColor && selectedColors.length > 1)

    setCurrentColor(newColor)
    await askForColor()
  }, [currentColor, askForColor, selectedColors])

  const handleNextColor = useCallback(() => {
    const now = Date.now()
    if (now - lastCommandTime.current < 1000) {
      return
    }
    lastCommandTime.current = now
    selectNewColor()
  }, [selectNewColor])

  const endGame = useCallback(async () => {
    const cleanup = () => {
      stopListening()
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel()
      }
      setAndLogGameState('initial', 'end game')
      setCurrentColor(null)
      setLastHeardWord('')
      setIsListening(false)
      setIsSpeaking(false)
      console.log('Game ended')
    }

    cleanup()
    await speak("Thank you for playing!")
    router.push('/')
  }, [stopListening, speak, setAndLogGameState, router])

  const handleVoiceCommand = useCallback((command) => {
    console.log('Voice command received:', command)
    console.log('Current game state:', gameState)
    console.log('Current color:', currentColor)
    console.log('Processing command:', command)
    const lowerCommand = command.toLowerCase()

    if (/\b(next|skip|forward)\b/.test(lowerCommand)) {
      console.log('Next command detected')
      handleNextColor()
    } else if (/\b(stop|end|quit|exit)\b/.test(lowerCommand)) {
      console.log('Stop command detected')
      endGame()
    } else if (/\b(help|instructions)\b/.test(lowerCommand)) {
      console.log('Help requested')
      speak("To proceed to the next color say 'next', or click anywhere on the screen. To end the game say 'stop'. For a hint you can ask 'what color is it?'. To display any color say 'show me', followed by the color you want to see.")
    } else if (/\b(what|which)(?:\s+(?:color|is|it))?\b/.test(lowerCommand)) {
      console.log('Color hint requested')
      speak(`The current color is ${currentColor}.`)
    } else if (/\b(show(?:\s+me)?)\s+(\w+)\b/.test(lowerCommand)) {
      const match = lowerCommand.match(/\b(show(?:\s+me)?)\s+(\w+)\b/)
      const requestedColor = match[2]
      if (colorTable.hasOwnProperty(requestedColor)) {
        console.log(`Showing requested color: ${requestedColor}`)
        setCurrentColor(requestedColor)
        speak(`Showing ${requestedColor}.`)
      } else {
        speak(`Sorry, ${requestedColor} is not in my color list.`)
      }
    } else {
      const colorGuess = Object.keys(colorTable).find(color => lowerCommand.includes(color))
      if (colorGuess) {
        if (colorGuess === currentColor) {
          speak(`Well done! The color is ${currentColor}.`)
        } else {
          speak("Try again!")
        }
      } else {
        console.log('No valid command or color guess detected - continuing to listen')
        startListening()
      }
    }
  }, [currentColor, gameState, speak, setCurrentColor, handleNextColor, endGame])

  const startListening = useCallback(
    debounce(() => {
      if (recognition.current?.state === 'running') {
        console.log('Recognition is already running, skipping start')
        return
      }
  
      if (gameState !== 'playing') {
        console.log('Cannot start listening: game state is not playing', { gameState })
        return
      }
  
      if (isListening) {
        console.log('Already listening flag is set, skipping start')
        return
      }
  
      if (isSpeaking) {
        console.log('Currently speaking, cannot start listening')
        return
      }
  
      if (restartTimeout.current) {
        clearTimeout(restartTimeout.current)
        restartTimeout.current = null
      }
  
      try {
        cleanupRecognition()
        recognition.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
        recognition.current.continuous = true
        recognition.current.interimResults = false
        recognition.current.lang = 'en-US'
  
        recognition.current.onresult = (event) => {
          const last = event.results.length - 1
          const transcript = event.results[last][0].transcript.trim()
          console.log('Recognized words:', transcript)
          setLastHeardWord(transcript)
          handleVoiceCommand(transcript.toLowerCase())
        }
  
        recognition.current.onstart = () => {
          console.log('Recognition started')
          setIsListening(true)
        }
  
        recognition.current.onend = () => {
          console.log('Recognition ended')
          setIsListening(false)
  
          if (restartTimeout.current) {
            clearTimeout(restartTimeout.current)
          }
  
          if (gameState === 'playing' && !isSpeaking) {
            restartTimeout.current = setTimeout(() => {
              if (gameState === 'playing' && !isListening && !isSpeaking) {
                startListening()
              }
            }, 120000) // 2 minutes
          }
        }
  
        recognition.current.onerror = (event) => {
          if (event.error === 'no-speech') {
            console.log('No speech detected, continuing to listen')
            return
          }
          
          if (event.error === 'aborted') {
            console.log('Recognition aborted')
            return
          }
          
          console.error('Recognition error:', event.error)
          setIsListening(false)
          
          if (gameState === 'playing') {
            restartTimeout.current = setTimeout(() => {
              if (gameState === 'playing' && !isListening && !isSpeaking) {
                startListening()
              }
            }, 120000) // 2 minutes
          }
        }
  
        recognition.current.start()
        console.log('Started listening')
      } catch (error) {
        console.error('Recognition start error:', error)
        setIsListening(false)
        
        if (gameState === 'playing') {
          restartTimeout.current = setTimeout(() => {
            if (gameState === 'playing' && !isListening && !isSpeaking) {
              startListening()
            }
          }, 120000) // 2 minutes
        }
      }
    }, 300),
    [gameState, isListening, isSpeaking, cleanupRecognition, handleVoiceCommand]
  )

  const startGame = useCallback(async () => {
    try {
      setAndLogGameState('intro', 'start game')
      await speak("Welcome to the Color Game! When prompted, say the color you think it is, or say 'help' at any time for further instructions. Good luck!")
      await selectNewColor()
    } catch (error) {
      console.error('Error starting game:', error)
      endGame()
    }
  }, [speak, selectNewColor, endGame, setAndLogGameState])

  const handleBackgroundClick = useCallback((e) => {
    if (gameState === 'playing' &&
      !e.target.closest('button') &&
      !e.target.closest('.top-menu')) {
      if (speechSynthesis.current?.speaking) {
        speechSynthesis.current.cancel()
        setIsSpeaking(false)
        setTimeout(() => {
          handleNextColor()
        }, 100)
      } else {
        handleNextColor()
      }
    }
  }, [gameState, handleNextColor])

  const handleSaveSettings = useCallback((newSelectedColors) => {
    setSelectedColors(newSelectedColors)
    localStorage.setItem('colorGameSelectedColors', JSON.stringify(newSelectedColors))
    console.log('Saving Color Game settings', newSelectedColors)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthesis.current = window.speechSynthesis
      const loadVoices = () => {
        const voices = speechSynthesis.current.getVoices()
        if (voices.length > 0) {
          speechUtterance.current = new SpeechSynthesisUtterance()
          speechUtterance.current.voice = voices[0]
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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition()
      recognition.current.continuous = true
      recognition.current.interimResults = false
      recognition.current.lang = 'en-US'
    }

    return () => {
      stopListening()
    }
  }, [stopListening])

  useEffect(() => {
    console.log('Game state changed:', gameState)
  }, [gameState])

  useEffect(() => {
    if (gameState === 'playing' && !isListening && !isSpeaking) {
      console.log('Starting listening due to game state change to playing')
      const timeoutId = setTimeout(() => {
        if (!isListening && !isSpeaking) {
          startListening()
        }
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [gameState, isListening, isSpeaking, startListening])

  useEffect(() => {
    const savedColors = localStorage.getItem('colorGameSelectedColors')
    if (savedColors) {
      try {
        const parsedColors = JSON.parse(savedColors)
        if (Array.isArray(parsedColors) && parsedColors.length >= 2) {
          setSelectedColors(parsedColors)
        } else {
          setSelectedColors(Object.keys(colorTable))
          localStorage.setItem('colorGameSelectedColors', JSON.stringify(Object.keys(colorTable)))
        }
      } catch (error) {
        console.error('Error parsing saved colors:', error)
        setSelectedColors(Object.keys(colorTable))
        localStorage.setItem('colorGameSelectedColors', JSON.stringify(Object.keys(colorTable)))
      }
    } else {
      localStorage.setItem('colorGameSelectedColors', JSON.stringify(Object.keys(colorTable)))
    }
  }, [])

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
    </div>
  )
}