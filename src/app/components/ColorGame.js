'use client'

import React from 'react'
import VoiceControls from './VoiceControls'

export default function ColorGame() {
  return (
    <div className="color-game">
      <h2 className="text-xl font-bold mb-4">Color Game</h2>
      <p className="mb-4">Coming soon...</p>
      <VoiceControls onCommand={(command) => console.log('Received command:', command)} />
    </div>
  )
}