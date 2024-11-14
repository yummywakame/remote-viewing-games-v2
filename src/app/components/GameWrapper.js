'use client'

import React from 'react'
import { useTheme } from 'next-themes'

export default function GameWrapper({ gameType, children }) {
  const { theme } = useTheme()

  const getBackgroundStyle = () => {
    if (gameType === 'color') {
      return {} // The background will be handled by the ColorGame component
    } else {
      return {
        backgroundColor: theme === 'dark' ? 'black' : 'white',
        color: theme === 'dark' ? 'white' : 'black'
      }
    }
  }

  return (
    <div style={getBackgroundStyle()} className="min-h-screen">
      {children}
    </div>
  )
}