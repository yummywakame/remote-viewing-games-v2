'use client'

import React, { useState } from 'react'
import { Settings } from 'lucide-react'
import ColorGameSettings from './ColorGameSettings'

export default function ColorGame() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <div className="game-container relative">
      <div className="game-content">
        <h2 className="game-title">Color Game</h2>
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
        <ColorGameSettings onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  )
}