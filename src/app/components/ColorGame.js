'use client'

import React from 'react'

export default function ColorGame() {
  return (
    <div className="game-container">
      <div className="game-content">
        <h2 className="game-title">Color Game</h2>
        <p className="game-description">Coming soon...</p>
        <button className="neon-button">
          <span className="neon-button-background"></span>
          <span className="neon-button-gradient"></span>
          <span className="neon-button-text">Start Listening</span>
        </button>
      </div>
    </div>
  )
}