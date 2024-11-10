'use client'

import React from 'react'
import VoiceControls from './VoiceControls'

export default function ShapeGame() {
  return (
    <div className="shape-game">
      <h2 className="text-xl font-bold mb-4">Shape Game</h2>
      <p className="mb-4">Coming soon...</p>
      <VoiceControls onCommand={(command) => console.log('Received command:', command)} />
    </div>
  )
}