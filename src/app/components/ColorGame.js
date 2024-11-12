'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Settings, Mic, MicOff } from 'lucide-react'
import GameSettings from './GameSettings'
import { useRouter } from 'next/navigation'
import FloatingBubble from './FloatingBubble'

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

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
  const [lastRecognizedWord, setLastRecognizedWord] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const speechSynthesis = useRef(null)
  const speechUtterance = useRef(null)
  const recognition = useRef(null)
  const lastCommandTime = useRef(0)
  const restartTimeout = useRef(null)
  const router = useRouter()

  const logGameState = useCallback((action) => {
    console.log(`Game state (${action}):`, gameState)
  }, [gameState])

  const setAndLogGameState = useCallback((newState, action) => {
    setGameState(newState)
    console.log(`Game state changed to ${newState} (${action})`)
  }, [])

  const cleanupRecognition = () => {
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
  }

  const stopListening = useCallback(() => {
    if (restartTimeout.current) {
      clearTimeout(restartTimeout.current)
      restartTimeout.current = null
    }
    
    cleanupRecognition()
    setIsListening(false)
    console.log('Stopped listening')
  }, [])

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

      if (Date.now() - lastCommandTime.current < 1000) {
        console.log('Too soon after last command, delaying start')
        setTimeout(startListening, 1000)
        return
      }

      try {
        cleanupRecognition()
        recognition.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
        recognition.current.continuous = false
        recognition.current.interimResults = false
        recognition.current.lang = 'en-US'

        recognition.current.onresult = (event) => {
          const last = event.results.length - 1
          const transcript = event.results[last][0].transcript.trim()
          console.log('Recognized words:', transcript)
          setLastRecognizedWord(transcript)
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
            }, 5000) // Increased to 5 seconds to match the initial cycle
          }
        }

        recognition.current.onerror = (event) => {
          if (event.error === 'no-speech') {
            console.log('No speech detected, continuing to listen')
            if (recognition.current) {
              recognition.current.stop()
            }
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
            }, 5000) // Increased to 5 seconds to match the initial cycle
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
          }, 5000) // Increased to 5 seconds to match the initial cycle
        }
      }
    },
    300
  ),
  [gameState, isListening, isSpeaking]
  )

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
        utterance.rate = 0.9
        utterance.pitch = 1.0

        utterance.onend = () => {
          console.log('Speech ended:', text)
          setIsSpeaking(false)
          resolve()

          if (text === "What color is this?") {
            setAndLogGameState('playing', 'after color prompt')
            setTimeout(() => startListening(), 1000) // Delay start listening
          } else if (gameState === 'playing' && text !== "Thank you for playing!") {
            setTimeout(() => startListening(), 1000) // Delay start listening
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

  const endGame = useCallback(async () => {
    const cleanup = () => {
      stopListening()
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel()
      }
      setAndLogGameState('initial', 'end game')
      setCurrentColor(null)
      setLastRecognizedWord('')
      setIsListening(false)
      setIsSpeaking(false)
      console.log('Game ended')
    }

    cleanup()
    await speak("Thank you for playing!")
    router.push('/')
  }, [stopListening, speak, setAndLogGameState, router])

  const handleVoiceCommand = useCallback((command) => {
    console.log('Voice command received:', command);
    console.log('Current game state:', gameState);
    console.log('Current color:', currentColor);
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
      speak("To proceed to the next color say, 'next', or click anywhere on the screen. To end the game say, 'stop'. For a hint you can ask, 'what color is it?' . To display any color say, 'show me', followed by the color you want to see.")
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
  }, [currentColor, handleNextColor, endGame, speak, gameState, startListening])

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

  const handleSaveSettings = () => {
    console.log('Saving Color Game settings')
  }

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
      console.log('Starting listening due to game state change to playing');
      const timeoutId = setTimeout(() => {
        if (!isListening && !isSpeaking) {
          startListening();
        }
      }, 1500); // Delay slightly longer than the speak function's delay
      return () => clearTimeout(timeoutId);
    }
  }, [gameState, isListening, isSpeaking, startListening]);

  return (
    <div className="relative min-h-screen">
      <div className="fixed top-0 left-0 right-0 bg-gray-800 z-10 top-menu">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-white text-xl font-bold">Remote Viewing Games</h1>
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
      {gameState !== 'initial' && (
        <FloatingBubble word={lastRecognizedWord} />
      )}
    </div>
  )
}