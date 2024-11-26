'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function GameDisplay({ gameType, currentItem, itemTable, onClick, gameState }) {
  const [backgroundMode, setBackgroundMode] = useState('dark')

  useEffect(() => {
    // Access localStorage only after component mounts
    const storedMode = typeof window !== 'undefined' 
      ? localStorage.getItem(`${gameType.toLowerCase()}GameBackgroundMode`) || 'dark'
      : 'dark'
    setBackgroundMode(storedMode)
  }, [gameType])

  const renderItem = () => {
    if (gameType === 'Color') {
      return null
    }

    const style = {
      fontSize: '15rem',
      fontWeight: 'bold',
      color: gameType === 'Number' ? 'white' : 'currentColor',
      maxWidth: '750px',
      maxHeight: '750px',
      margin: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }

    if (gameType === 'Shape' && currentItem) {
      return (
        <div className="flex items-center justify-center">
          <Image
            src={itemTable[currentItem]}
            alt={`${currentItem.split('-')[0]} shape`}
            width={450}
            height={450}
            style={{ filter: 'invert(1)' }}
          />
        </div>
      )
    }

    return (
      <motion.div
        style={style}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {currentItem}
      </motion.div>
    )
  }

  const getBackgroundColor = () => {
    if (gameState === 'initial') {
      return 'transparent'
    }
    if (gameType === 'Color') {
      return itemTable[currentItem]
    }
    return backgroundMode === 'dark' ? 'black' : 'white'
  }

  const backgroundColor = getBackgroundColor()

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center transition-colors duration-500"
      style={{ backgroundColor }}
      onClick={onClick}
    >
      {renderItem()}
    </div>
  )
}

