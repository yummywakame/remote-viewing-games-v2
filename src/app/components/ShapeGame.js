'use client'

import React, { useState } from 'react'
import { Settings } from 'lucide-react'
import GameSettings from './GameSettings'

export default function ShapeGame() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleSaveSettings = () => {
    // Implement shape game specific save logic here
    console.log('Saving Shape Game settings')
  }

  return (
    <div className="game-container relative">
      <div className="game-content">
        <h2 className="game-title">Shape Game</h2>
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
          title="Shape Game" 
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
        >
          <div>
            <p>Shape Game specific settings go here</p>
            {/* Add shape selection or other specific settings */}
          </div>
        </GameSettings>
      )}
    </div>
  )
}