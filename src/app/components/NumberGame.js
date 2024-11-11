'use client'

import React, { useState } from 'react'
import { Settings } from 'lucide-react'
import GameSettings from './GameSettings'

export default function NumberGame() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleSaveSettings = () => {
    // Implement number game specific save logic here
    console.log('Saving Number Game settings')
  }

  return (
    <div className="game-container relative">
      <div className="game-content">
        <h2 className="game-title">Number Game</h2>
        <p className="game-description">Coming soon...</p>
        <button className="neon-button">
          <span className="neon-button-background"></span>
          <span className="neon-button-gradient"></span>
          <span className="neon-button-text">Start Listening</span>
        </button>
      </div>
      <button 
        className="fixed bottom-4 right-4 text-white hover:animate-spin-slow transition-all duration-300"
        onClick={() => setIsSettingsOpen(true)}
      >
        <Settings size={24} />
      </button>
      {isSettingsOpen && (
        <GameSettings 
          title="Number Game" 
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
        >
          <div>
            <p>Number Game specific settings go here</p>
            {/* Add number range selection or other specific settings */}
          </div>
        </GameSettings>
      )}
    </div>
  )
}