'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function GameDisplay({ gameType, currentItem, itemTable, onClick }) {
  const renderItem = () => {
    if (gameType === 'Color') {
      return null // Color game doesn't display an item
    }

    const style = {
      fontSize: '15rem',
      fontWeight: 'bold',
      color: gameType === 'Number' ? 'white' : 'currentColor',
      maxWidth: '500px',
      maxHeight: '500px',
      margin: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }

    if (gameType === 'Shape') {
      return (
        <Image
          src={itemTable[currentItem]}
          alt={currentItem}
          width={300}
          height={300}
          style={{ filter: 'invert(1)' }}
        />
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
    if (gameType === 'Color') {
      return itemTable[currentItem]
    }
    const backgroundMode = localStorage.getItem(`${gameType.toLowerCase()}GameBackgroundMode`) || 'dark'
    return backgroundMode === 'dark' ? 'black' : 'white'
  }

  const backgroundColor = getBackgroundColor()

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor, transition: 'background-color 0.5s ease' }}
      onClick={onClick}
    >
      {renderItem()}
    </div>
  )
}

