'use client'

import React, { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
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
  const [gameState, setGameState] = useState('initial') // 'initial', 'intro', 'playing'
  const [currentColor, setCurrentColor] = useState(null)
  const [speech, setSpeech] = useState(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    const speechSynthesis = window.speechSynthesis
    const utterance = new SpeechSynthesisUtterance()
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    setSpeech(utterance)

    return () => {
      speechSynthesis.cancel()
    }
  }, [])

  const handleSaveSettings = () => {
    console.log('Saving Color Game settings')
  }

  const speak = (text, onEndCallback) => {
    if (speech) {
      speech.text = text
      if (onEndCallback) {
        const handleEnd = () => {
          onEndCallback()
          speech.removeEventListener('end', handleEnd)
        }
        speech.addEventListener('end', handleEnd)
      }
      window.speechSynthesis.speak(speech)
    }
  }

  const startGame = () => {
    setGameState('intro')
    speak("Welcome to the Color Game! Say 'next' at any time to proceed to the next color and say 'stop' to end the game.", () => {
      setGameState('playing')
      selectNewColor()
    })
  }

  const selectNewColor = () => {
    const colors = Object.keys(colorTable)
    let newColor
    do {
      newColor = colors[Math.floor(Math.random() * colors.length)]
    } while (newColor === currentColor && colors.length > 1)
    setCurrentColor(newColor)
    speak("What color is this?")
  }

  const handleNext = () => {
    if (!isSpeaking) {
      selectNewColor()
    }
  }

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ 
        backgroundColor: gameState === 'playing' ? colorTable[currentColor] : 'rgb(17, 24, 39)',
        transition: 'background-color 0.5s ease'
      }}
    >
      <div className="game-content">
        {gameState === 'initial' && (
          <>
            <h2 className="game-title">Color Game</h2>
            <p className="game-description">Get your blindfold ready and select "Start Game" to begin!</p>
            <button className="neon-button" onClick={startGame}>
              <span className="neon-button-background"></span>
              <span className="neon-button-gradient"></span>
              <span className="neon-button-text">Start Game</span>
            </button>
          </>
        )}
        {gameState === 'intro' && (
          <p className="game-description">Game is starting...</p>
        )}
        {gameState === 'playing' && (
          <button 
            className="neon-button" 
            onClick={handleNext}
            disabled={isSpeaking}
          >
            <span className="neon-button-background"></span>
            <span className="neon-button-gradient"></span>
            <span className="neon-button-text">Next Color</span>
          </button>
        )}
      </div>
      <button 
        className="fixed bottom-4 right-4 text-white hover:animate-spin-slow transition-all duration-300"
        onClick={() => setIsSettingsOpen(true)}
      >
        <Settings size={24} />
      </button>
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
    </div>
  )
}