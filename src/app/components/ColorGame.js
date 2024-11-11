'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Settings, Mic, MicOff } from 'lucide-react'
import GameSettings from './GameSettings'

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
  const shouldRestartRecognition = useRef(true)

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
      recognition.current.continuous = false
      recognition.current.interimResults = false
      recognition.current.lang = 'en-US'
    }

    return () => {
      stopListening()
    }
  }, [])

  const speak = useCallback((text) => {
    return new Promise((resolve, reject) => {
      if (!speechSynthesis.current || !speechUtterance.current) {
        reject(new Error('Speech synthesis not initialized'))
        return
      }

      stopListening()
      setIsSpeaking(true)
      shouldRestartRecognition.current = true

      speechSynthesis.current.cancel()
      speechUtterance.current.text = text
      
      speechUtterance.current.onend = () => {
        console.log('Speech ended')
        setIsSpeaking(false)  // Ensure this happens before resolve
        resolve()
        // Remove the startListening call from here
      }

      speechUtterance.current.onerror = (event) => {
        console.error('Speech synthesis error:', event)
        setIsSpeaking(false)
        reject(event)
      }

      speechSynthesis.current.speak(speechUtterance.current)
    })
  }, [gameState])

  const stopListening = useCallback(() => {
    if (recognition.current) {
      shouldRestartRecognition.current = false
      try {
        recognition.current.stop()
      } catch (error) {
        console.error('Error stopping recognition:', error)
      }
      setIsListening(false)
      console.log('Stopped listening')
    }
  }, [])

  const startListening = useCallback(() => {
    if (!recognition.current || isListening) {
      console.log('Cannot start listening:', { isListening, isSpeaking })
      return
    }
    
    // Force reset speaking state if it's stuck
    if (isSpeaking) {
      console.log('Resetting stuck speaking state')
      setIsSpeaking(false)
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
        shouldRestartRecognition.current = true
      }

      recognition.current.onend = () => {
        console.log('Recognition ended')
        setIsListening(false)
        if (gameState === 'playing' && shouldRestartRecognition.current && !isSpeaking) {
          console.log('Restarting recognition')
          setTimeout(() => {
            recognition.current.start()
          }, 100)
        }
      }

      recognition.current.onerror = (event) => {
        console.error('Recognition error:', event.error)
        setIsListening(false)
        if (event.error !== 'aborted' && gameState === 'playing' && shouldRestartRecognition.current) {
          setTimeout(() => {
            startListening()
          }, 100)
        }
      }
      
      recognition.current.start()
      console.log('Started listening')
    } catch (error) {
      console.error('Recognition start error:', error)
      setIsListening(false)
    }
  }, [gameState, isListening, isSpeaking])

  const selectNewColor = useCallback(async () => {
    const colors = Object.keys(colorTable)
    let newColor
    do {
      newColor = colors[Math.floor(Math.random() * colors.length)]
    } while (newColor === currentColor && colors.length > 1)
    
    setCurrentColor(newColor)
    try {
      console.log('Speaking new color prompt')
      await speak("What color is this?")
      console.log('Speech completed')
      // Start listening after the initial prompt
      startListening()
    } catch (error) {
      console.error('Error in selectNewColor:', error)
    }
  }, [currentColor, speak, startListening])

  const endGame = useCallback(() => {
    shouldRestartRecognition.current = false
    stopListening()
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel()
    }
    setGameState('initial')
    setCurrentColor(null)
    setRecognizedWords([])
    console.log('Game ended')
  }, [stopListening])

  const handleNextColor = useCallback(() => {
    const now = Date.now()
    if (now - lastCommandTime.current < 1000) {
      return
    }
    lastCommandTime.current = now
    selectNewColor()
  }, [selectNewColor])

  const handleVoiceCommand = useCallback((command) => {
    console.log('Processing command:', command)
    if (command.includes('next')) {
      handleNextColor()
    } else if (command.includes('stop')) {
      endGame()
    }
  }, [handleNextColor, endGame])

  const startGame = useCallback(async () => {
    try {
      setGameState('intro')
      await speak("Welcome to the Color Game! Say 'next' to proceed to the next color and 'stop' to end the game.")
      setGameState('playing')
      await selectNewColor()
    } catch (error) {
      console.error('Error starting game:', error)
      endGame()
    }
  }, [speak, selectNewColor, endGame])

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
                  <span className="neon-button-text">End Game</span>
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