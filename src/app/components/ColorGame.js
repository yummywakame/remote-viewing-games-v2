'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Settings, Mic, MicOff } from 'lucide-react'
import GameSettings from './GameSettings'
import { useRouter } from 'next/navigation'

const colorTable = {
  yellow: '#FFD700',
  green: '#008000',
  blue: '#1E90FF',
  purple: '#6A5ACD',
  pink: '#FF00FF',
  red: '#DC143C',
  orange: '#FF7F50',
}

export default function ColorGame() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [gameState, setGameState] = useState('initial')
  const [currentColor, setCurrentColor] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [recognizedWords, setRecognizedWords] = useState([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const speechSynthesis = useRef(null)
  const speechUtterance = useRef(null)
  const recognition = useRef(null)
  const lastCommandTime = useRef(0)
  const restartTimeout = useRef(null)

  const logGameState = useCallback((action) => {
    console.log(`Game state (${action}):`, gameState)
  }, [gameState])

  const setAndLogGameState = useCallback((newState, action) => {
    setGameState(newState)
    console.log(`Game state changed to ${newState} (${action})`)
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
  }, [])

  const stopListening = useCallback(() => {
    if (restartTimeout.current) {
      clearTimeout(restartTimeout.current)
      restartTimeout.current = null
    }
    if (recognition.current) {
      try {
        recognition.current.abort()
      } catch (error) {
        console.error('Error stopping recognition:', error)
      }
      recognition.current.onend = null
      recognition.current.onstart = null
      recognition.current.onerror = null
      recognition.current.onresult = null
      setIsListening(false)
      console.log('Stopped listening')
    }
  }, [])

  const handleVoiceCommand = useCallback((command) => {
    console.log('Processing command:', command)
    const lowerCommand = command.toLowerCase()

    if (/\b(next|skip|forward)\b/.test(lowerCommand)) {
      console.log('Next command detected')
      handleNextColor()
    } else if (/\b(stop|end|quit|exit)\b/.test(lowerCommand)) {
      console.log('Stop command detected')
      endGame()
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
      // Check for color guess
      const colorGuess = Object.keys(colorTable).find(color => lowerCommand.includes(color))
      if (colorGuess) {
        if (colorGuess === currentColor) {
          speak(`Well done! The color is ${currentColor}.`)
        } else {
          speak("Try again!")
        }
      } else {
        console.log('No valid command or color guess detected - continuing to listen')
      }
    }
  }, [currentColor])

  const startListening = useCallback(() => {
    if (gameState !== 'playing') {
      console.log('Cannot start listening: game state is not playing', { gameState })
      return
    }

    if (isListening || isSpeaking) {
      console.log('Already listening or speaking, skipping start', { isListening, isSpeaking })
      return
    }

    logGameState('before start listening')
    console.log('Attempting to start listening:', { isListening, isSpeaking })
    if (!recognition.current || isSpeaking) {
      console.log('Cannot start listening:', { isListening, isSpeaking, gameState })
      return
    }

    try {
      recognition.current.onresult = (event) => {
        const last = event.results.length - 1
        const transcript = event.results[last][0].transcript.trim().toLowerCase()
        console.log('Recognized words:', transcript)
        setRecognizedWords(prevWords => [...prevWords, transcript])
        handleVoiceCommand(transcript)
      }

      recognition.current.onstart = () => {
        console.log('Recognition started')
        setIsListening(true)
        logGameState('after recognition start')
      }

      recognition.current.onend = () => {
        console.log('Recognition ended')
        setIsListening(false)
        logGameState('after recognition end')

        // Clear any existing restart timeout
        if (restartTimeout.current) {
          clearTimeout(restartTimeout.current)
        }

        // Only restart if we're still playing and not speaking
        if (gameState === 'playing' && !isSpeaking) {
          console.log('Scheduling recognition restart in 3 minutes')
          restartTimeout.current = setTimeout(() => {
            if (gameState === 'playing' && !isListening && !isSpeaking) {
              console.log('Attempting scheduled recognition restart')
              startListening()
            }
          }, 180000) // 3 minutes
        }
      }

      recognition.current.onerror = (event) => {
        // Ignore no-speech errors
        if (event.error === 'no-speech') {
          console.log('No speech detected, continuing to listen')
          return
        }

        console.error('Recognition error:', event.error)
        setIsListening(false)
        logGameState('after recognition error')

        if (event.error !== 'aborted' && gameState === 'playing') {
          restartTimeout.current = setTimeout(() => {
            if (gameState === 'playing' && !isListening && !isSpeaking) {
              startListening()
            }
          }, 180000) // 3 minutes
        }
      }

      recognition.current.start()
      console.log('Started listening')
    } catch (error) {
      console.error('Recognition start error:', error)
      setIsListening(false)
      logGameState('after recognition start error')
      if (gameState === 'playing') {
        restartTimeout.current = setTimeout(() => {
          if (gameState === 'playing' && !isListening && !isSpeaking) {
            startListening()
          }
        }, 180000) // 3 minutes
      }
    }
  }, [gameState, isListening, isSpeaking, handleVoiceCommand, logGameState])

  const speak = useCallback((text) => {
    return new Promise((resolve, reject) => {
      if (!speechSynthesis.current || !speechUtterance.current) {
        reject(new Error('Speech synthesis not initialized'))
        return
      }

      stopListening()
      setIsSpeaking(true)

      speechSynthesis.current.cancel()
      speechUtterance.current.text = text

      speechUtterance.current.onend = () => {
        console.log('Speech ended')
        setIsSpeaking(false)
        resolve()

        if (text === "What color is this?" && gameState === 'playing') {
          setAndLogGameState('playing', 'after color prompt')
          startListening()
        }
      }

      speechUtterance.current.onerror = (event) => {
        console.error('Speech synthesis error:', event)
        setIsSpeaking(false)
        if (event.error !== 'interrupted' && gameState === 'playing') {
          reject(event)
        } else {
          resolve() // Resolve promise if speech was interrupted due to navigation
        }
      }

      speechSynthesis.current.speak(speechUtterance.current)
    })
  }, [stopListening, setAndLogGameState, startListening, gameState])

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
    const colors = Object.keys(colorTable)
    let newColor
    do {
      newColor = colors[Math.floor(Math.random() * colors.length)]
    } while (newColor === currentColor && colors.length > 1)

    setCurrentColor(newColor)
    await askForColor()
  }, [currentColor, askForColor])

  const handleNextColor = useCallback(() => {
    const now = Date.now()
    if (now - lastCommandTime.current < 1000) {
      return
    }
    lastCommandTime.current = now
    selectNewColor()
  }, [selectNewColor])

  const endGame = useCallback(() => {
    const cleanup = () => {
      stopListening()
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel()
      }
      setAndLogGameState('initial', 'end game')
      setCurrentColor(null)
      setRecognizedWords([])
      setIsListening(false)
      setIsSpeaking(false)
      console.log('Game ended')
    }

    cleanup()
    speak("Thank you for playing!")
  }, [stopListening, speak, setAndLogGameState])

  const startGame = useCallback(async () => {
    try {
      setAndLogGameState('intro', 'start game')
      await speak("Welcome to the Color Game! Say the color you perceive out aloud to find out if you are correct. Say, 'next', to proceed to the next color, or click anywhere on the screen. To end the game say, 'stop'. For a hint you can ask, 'what color is it?' at any time, or to display any color say, 'show me', followed by the color you want to see.")
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
      handleNextColor()
    }
  }, [gameState, handleNextColor])

  const handleSaveSettings = () => {
    console.log('Saving Color Game settings')
  }

  useEffect(() => {
    console.log('Game state changed:', gameState)
  }, [gameState])

  useEffect(() => {
    if (gameState === 'playing' && !isListening && !isSpeaking) {
      console.log('Starting listening due to game state change to playing')
      const timer = setTimeout(() => {
        if (gameState === 'playing' && !isListening && !isSpeaking) {
          startListening()
        }
      }, 1000) // Add a small delay to ensure all state updates have propagated
      return () => clearTimeout(timer)
    }
  }, [gameState, isListening, isSpeaking, startListening])

  const router = useRouter()

  const handleNavigateHome = useCallback(() => {
    const cleanup = () => {
      stopListening()
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel()
      }
      setAndLogGameState('initial', 'navigate home')
      setCurrentColor(null)
      setRecognizedWords([])
      setIsListening(false)
      setIsSpeaking(false)
      console.log('Game cleaned up for navigation')
    }

    cleanup()
    router.push('/')
  }, [stopListening, setAndLogGameState, router])

  return (
    <div className="relative min-h-screen">
      <div className="fixed top-0 left-0 right-0 bg-gray-800 z-10 top-menu">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 
              className="text-white text-xl font-bold cursor-pointer hover:text-gray-300 transition-colors"
              onClick={handleNavigateHome}
            >
              Remote Viewing Games
            </h1>
            <div className="flex items-center space-x-4">
              {isListening && !isSpeaking ? (
                <Mic className="text-green-500" size={24} />
              ) : (
                <MicOff className="text-red-500" size={24} />
              )}
              <button
                className="text-white hover:animate-spin-slow transition-all duration-300"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        className="fixed inset-0 pt-16"
        style={{
          backgroundColor: gameState === 'playing' || gameState === 'intro' ? colorTable[currentColor] : 'rgb(17, 24, 39)',
          transition: 'background-color 0.5s ease'
        }}
        onClick={handleBackgroundClick}
      >
        <div className="flex items-center justify-center h-full">
          <div className="game-content text-center">
            {gameState === 'initial' && (
              <>
                <h2 className="game-title text-white text-3xl font-bold mb-6">Color Game</h2>
                <p className="game-description text-white mb-8">Get your blindfold ready and select "Start Game" to begin!</p>
                <button className="neon-button" onClick={startGame}>
                  <span className="neon-button-background"></span>
                  <span className="neon-button-gradient"></span>
                  <span className="neon-button-text">Start Game</span>
                </button>
              </>
            )}
            {(gameState === 'intro' || gameState === 'playing') && (
              <>
                {gameState === 'intro' && (
                  <p className="game-description text-white mb-8">Game is starting...</p>
                )}
                <button
                  className="neon-button"
                  onClick={endGame}
                >
                  <span className="neon-button-background"></span>
                  <span className="neon-button-gradient"></span>
                  <span className="neon-button-text">Stop Game</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {isSettingsOpen && (
        <GameSettings
          title="Color Game"
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
        >
          <div>
            <p>Color Game specific settings go here</p>
          </div>
        </GameSettings>
      )}
      <div className="fixed bottom-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded">
        <h3>Recognized Words:</h3>
        <ul>
          {recognizedWords.slice(-5).map((word, index) => (
            <li key={index}>{word}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}